#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

ask() {
	while true ; do
		if [[ -z $3 ]] ; then
			read -r -p "$1 [$2]: " result
		else
			read -r -p "$1 ($3) [$2]: " result
		fi
		if [[ -z $result ]]; then
			ask_result=$2
			return
		fi
		array=$3
		if [[ -z $3 || " ${array[*]} " =~ ${result} ]]; then
			ask_result=$result
			return
		else
			echo "Invalid option: $result"
		fi
	done
}

ask_docker_folder() {
	while true ; do

		read -r -p "$1 [$2]: " result

		if [[ -z $result ]]; then
			ask_result=$2
			return
		fi

		if [[ $result == /* || $result == ./* ]]; then
			ask_result=$result
			return
		else
			echo "Invalid folder: $result"
		fi


	done
}

if [[ $(id -u) == "0" ]] ; then
	echo "Do not run this script as root."
	exit 1
fi

if ! command -v wget &> /dev/null ; then
	echo "wget executable not found. Is wget installed?"
	exit 1
fi

if ! command -v docker &> /dev/null ; then
	echo "docker executable not found. Is docker installed?"
	exit 1
fi

DOCKER_COMPOSE_CMD="docker-compose"
if ! command -v ${DOCKER_COMPOSE_CMD} ; then
	if docker compose version &> /dev/null ; then
		DOCKER_COMPOSE_CMD="docker compose"
	else
		echo "docker-compose executable not found. Is docker-compose installed?"
		exit 1
	fi
fi


# Check if user has permissions to run Docker by trying to get the status of Docker (docker status).
# If this fails, the user probably does not have permissions for Docker.
if ! docker stats --no-stream &> /dev/null ; then
	echo ""
	echo "WARN: It look like the current user does not have Docker permissions."
	echo "WARN: Use 'sudo usermod -aG docker $USER' to assign Docker permissions to the user."
	echo ""
	sleep 3
fi

default_time_zone=$(timedatectl show -p Timezone --value)
if [[ -z $default_time_zone ]]; then
	default_time_zone="UTC"
fi

set -e

echo ""
echo "#############################################"
echo "###   budgetbee docker installation   ###"
echo "#############################################"
echo ""
echo "This script will download, configure and start budgetbee."

echo ""
echo "1. Configuration"
echo "============================"

echo ""
echo "Add you local ip"
echo ""

IP=$(hostname -I | awk '{print $1}')
ask "ip" "$IP"
IP=$ask_result

ask "Web App Port" "8895"
APP_PORT=$ask_result

ask "Api Port" "8085"
API_PORT=$ask_result

ask "MySQL Port" "3306"
DB_PORT=$ask_result

echo ""
echo "BudgetBee requires the current time zone."
echo "Example: Europe/Madrid"
echo "See here for a list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
echo ""

ask "Current time zone" "$default_time_zone"
TIME_ZONE=$ask_result

echo ""
echo "2. Folder configuration"
echo "======================="
echo ""
echo "The target folder is used to store the configuration files. "
echo "You will need this folder whenever you want to start, stop, update or "
echo "maintain your budgetbee instance."
echo ""

ask "Target folder" "$(pwd)"
TARGET_FOLDER=$ask_result

echo ""
echo "The database folder, where your database stores its data."
echo "Leave empty to have this managed by docker."
echo ""
echo "CAUTION: If specified, you must specify an absolute path starting with /"
echo "or a relative path starting with ./ here."
echo ""

ask_docker_folder "Database folder" ""
DATABASE_FOLDER=$ask_result

echo ""
echo "3. Login credentials"
echo "===================="
echo ""
echo "Specify initial login credentials. You can change these later."
echo "A mail address is required, however it is not used in BudgetBee. You don't"
echo "need to provide an actual mail address."
echo ""

ask "budgetbee username" "$(whoami)"
USERNAME=$ask_result

while true; do
	read -r -sp "budgetbee password: " PASSWORD
	echo ""

	if [[ -z $PASSWORD ]] ; then
		echo "Password cannot be empty."
		continue
	fi

	read -r -sp "budgetbee password (again): " PASSWORD_REPEAT
	echo ""

	if [[ ! "$PASSWORD" == "$PASSWORD_REPEAT" ]] ; then
		echo "Passwords did not match"
	else
		break
	fi
done

ask "Email" "$USERNAME@localhost"
EMAIL=$ask_result

echo ""
echo "4. Database credentials"
echo "======================="
echo ""
echo "These are MySQL credentials used by the application to connect to the DB."
echo ""

ask "Database name" "budgetbee"
DB_DATABASE=$ask_result

ask "Database user" "$(whoami)"
DB_USERNAME=$ask_result

ask "Generate random DB passwords?" "y" "y n"
GENERATE_RANDOM_DB_PASSWORDS=$ask_result

if [[ "$GENERATE_RANDOM_DB_PASSWORDS" == "y" ]] ; then
	DB_PASSWORD=$(tr --delete --complement 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head --bytes 64)
	DB_ROOT_PASSWORD=$(tr --delete --complement 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head --bytes 64)
else
	while true; do
		read -r -sp "database user password: " DB_PASSWORD
		echo ""

		if [[ -z $DB_PASSWORD ]] ; then
			echo "Database user password cannot be empty."
			continue
		fi

		read -r -sp "database user password (again): " DB_PASSWORD_REPEAT
		echo ""

		if [[ ! "$DB_PASSWORD" == "$DB_PASSWORD_REPEAT" ]] ; then
			echo "Passwords did not match"
		else
			break
		fi
	done

	while true; do
		read -r -sp "database root password: " DB_ROOT_PASSWORD
		echo ""

		if [[ -z $DB_ROOT_PASSWORD ]] ; then
			echo "Database root password cannot be empty."
			continue
		fi

		read -r -sp "database root password (again): " DB_ROOT_PASSWORD_REPEAT
		echo ""

		if [[ ! "$DB_ROOT_PASSWORD" == "$DB_ROOT_PASSWORD_REPEAT" ]] ; then
			echo "Passwords did not match"
		else
			break
		fi
	done
fi

echo ""
echo "Summary"
echo "======="
echo ""

if [[ -z $DATABASE_FOLDER ]] ; then
	echo "Database folder: Managed by docker"
else
	echo "Database folder: $DATABASE_FOLDER"
fi

echo ""
echo "Target folder: $TARGET_FOLDER"
echo "Web port: $APP_PORT"
echo "Api port: $API_PORT"
echo "MySQL port: $DB_PORT"
echo "Timezone: $TIME_ZONE"
echo "budgetbee username: $USERNAME"
echo "budgetbee email: $EMAIL"
echo "Database name: $DB_DATABASE"
echo "Database user: $DB_USERNAME"

if [[ "$GENERATE_RANDOM_DB_PASSWORDS" == "y" ]] ; then
	echo "Database passwords: generated automatically"
else
	echo "Database passwords: provided manually"
fi

echo ""
read -r -p "Press any key to install."

echo ""
echo "Installing BudgetBee..."
echo ""

mkdir -p "$TARGET_FOLDER"

cd "$TARGET_FOLDER"

if [[ -f "$SCRIPT_DIR/docker/docker-compose.yml" && -f "$SCRIPT_DIR/docker/.env.example" && -f "$SCRIPT_DIR/docker/default.conf" ]]; then
	cp "$SCRIPT_DIR/docker/docker-compose.yml" docker-compose.yml
	cp "$SCRIPT_DIR/docker/.env.example" .env
	cp "$SCRIPT_DIR/docker/default.conf" default.conf
else
	wget "https://raw.githubusercontent.com/TheFatPanda-Dev/budgetbee/main/docker/docker-compose.yml" -O docker-compose.yml
	wget "https://raw.githubusercontent.com/TheFatPanda-Dev/budgetbee/main/docker/.env.example" -O .env
	wget "https://raw.githubusercontent.com/TheFatPanda-Dev/budgetbee/main/docker/default.conf" -O default.conf
fi

if [[ -d "$SCRIPT_DIR/api" && -d "$SCRIPT_DIR/web" ]]; then
	sed -i "s#context: ../api#context: $SCRIPT_DIR/api#g" docker-compose.yml
	sed -i "s#context: ../web#context: $SCRIPT_DIR/web#g" docker-compose.yml
fi

SECRET_KEY=$(tr --delete --complement 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head --bytes 64)

sed -i "s/HOST=localhost/HOST=$IP/g" .env
if grep -q "^DB_HOST=" .env ; then
	sed -i "s#^DB_HOST=.*#DB_HOST=mysql#g" .env
else
	echo "DB_HOST=mysql" >> .env
fi
sed -i "s/DB_DATABASE=budgetbee/DB_DATABASE=$DB_DATABASE/g" .env
sed -i "s/DB_USERNAME=user/DB_USERNAME=$DB_USERNAME/g" .env
sed -i "s/DB_PASSWORD=password/DB_PASSWORD=$DB_PASSWORD/g" .env
sed -i "s/DB_ROOT_PASSWORD=root_password/DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD/g" .env
sed -i "s/APP_PORT=8895/APP_PORT=$APP_PORT/g" .env
sed -i "s/API_PORT=8085/API_PORT=$API_PORT/g" .env

if grep -q "^DB_PORT=" .env ; then
	sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/g" .env
else
	echo "DB_PORT=$DB_PORT" >> .env
fi

# If the database folder was provided (not blank), replace the pgdata/db_data volume with a bind mount# of the provided folder
if [[ -n $DATABASE_FOLDER ]] ; then
	sed -i "s#- db_data:/var/lib/mysql#- $DATABASE_FOLDER:/var/lib/mysql#g" docker-compose.yml
	sed -i "/^\s*db_data:/d" docker-compose.yml
fi

# remove trailing blank lines from end of file
sed -i -e :a -e '/^\n*$/{$d;N;};/\n$/ba' docker-compose.yml
# if last line in file contains "volumes:", remove that line since no more named volumes are left
l1=$(grep -n '^volumes:' docker-compose.yml | cut -d : -f 1)  # get line number containing volume: at begin of line
l2=$(wc -l < docker-compose.yml)  # get total number of lines
if [ "$l1" -eq "$l2" ] ; then
	sed -i "/^volumes:/d" docker-compose.yml
fi


${DOCKER_COMPOSE_CMD} pull

echo "Starting DB first for initilzation"
${DOCKER_COMPOSE_CMD} up --detach mysql
# hopefully enough time for even the slower systems
sleep 15

${DOCKER_COMPOSE_CMD} stop
# ${DOCKER_COMPOSE_CMD} run --rm -e DJANGO_SUPERUSER_PASSWORD="$PASSWORD" webserver createsuperuser --noinput --username "$USERNAME" --email "$EMAIL"

${DOCKER_COMPOSE_CMD} up --detach

echo "Waiting for all services to be up before creating the user..."
MAX_SERVICE_RETRIES=60
SERVICE_RETRY_DELAY=3
SERVICE_ATTEMPT=1

while true ; do
	total_services=$(${DOCKER_COMPOSE_CMD} ps --services 2>/dev/null | wc -l)
	running_services=$(${DOCKER_COMPOSE_CMD} ps --services --filter status=running 2>/dev/null | wc -l)
	db_healthy=$(${DOCKER_COMPOSE_CMD} ps mysql 2>/dev/null | grep -c "healthy" || true)

	if [[ "$total_services" -gt 0 && "$running_services" -eq "$total_services" && "$db_healthy" -gt 0 ]] ; then
		echo "All services are up and database is healthy."
		break
	fi

	if [[ $SERVICE_ATTEMPT -ge $MAX_SERVICE_RETRIES ]] ; then
		echo "ERROR: Services did not become ready in time."
		${DOCKER_COMPOSE_CMD} ps
		exit 1
	fi

	echo "Service readiness check ${SERVICE_ATTEMPT}/${MAX_SERVICE_RETRIES} not ready yet. Retrying in ${SERVICE_RETRY_DELAY}s..."
	SERVICE_ATTEMPT=$((SERVICE_ATTEMPT + 1))
	sleep $SERVICE_RETRY_DELAY
done

echo "Waiting for webserver and database initialization before creating the user..."
MAX_RETRIES=30
RETRY_DELAY=3
ATTEMPT=1

while true ; do
	create_user_output=$(${DOCKER_COMPOSE_CMD} exec -T webserver php scripts/create_user.php "$USERNAME" "$EMAIL" "$PASSWORD" 2>&1)
	create_user_exit=$?

	if [[ $create_user_exit -eq 0 ]] ; then
		echo "Initial user created successfully."
		break
	fi

	echo "$create_user_output"

	if echo "$create_user_output" | grep -qi "email has already been taken" ; then
		echo "Initial user already exists. Continuing installation."
		break
	fi

	if [[ $ATTEMPT -ge $MAX_RETRIES ]] ; then
		echo "ERROR: Could not create initial user after ${MAX_RETRIES} attempts."
		echo "You can create it manually later with:"
		echo "${DOCKER_COMPOSE_CMD} exec -T webserver php scripts/create_user.php \"$USERNAME\" \"$EMAIL\" \"<password>\""
		exit 1
	fi

	echo "User creation attempt ${ATTEMPT}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY}s..."
	ATTEMPT=$((ATTEMPT + 1))
	sleep $RETRY_DELAY
done
