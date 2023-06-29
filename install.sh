#!/bin/bash

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
IP=$IP

echo ""
echo "Ports."
echo "First, config the web app PORT"
echo ""





ask "Port" "8895"
APP_PORT=$ask_result

echo ""
echo "Second, API PORT"
echo ""

ask "Port" "8085"
API_PORT=$ask_result

echo ""
echo "And third, DB PORT"
echo ""

ask "Port" "3307"
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

ask "Target folder" "$(pwd)/budgetbee"
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
echo "DB port: $DB_PORT"
echo "Timezone: $TIME_ZONE"
echo "budgetbee username: $USERNAME"
echo "budgetbee email: $EMAIL"

echo ""
read -r -p "Press any key to install."

echo ""
echo "Installing BudgetBee..."
echo ""

mkdir -p "$TARGET_FOLDER"

cd "$TARGET_FOLDER"

wget "https://raw.githubusercontent.com/budgetbee/budgetbee/main/docker/docker-compose.yml" -O docker-compose.yml
wget "https://raw.githubusercontent.com/budgetbee/budgetbee/main/.env.example" -O .env
wget "https://raw.githubusercontent.com/budgetbee/budgetbee/main/docker/nginx/nginx.conf" -O default.conf

SECRET_KEY=$(tr --delete --complement 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head --bytes 64)
DB_PASSWORD=$(tr --delete --complement 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head --bytes 64)
DB_ROOT_PASSWORD=$(tr --delete --complement 'a-zA-Z0-9' < /dev/urandom 2>/dev/null | head --bytes 64)

DEFAULT_LANGUAGES=("eng spa")

{
	echo "budgetbee_TIME_ZONE=$TIME_ZONE"
	echo "budgetbee_SECRET_KEY=$SECRET_KEY"
} > docker-compose.env

DB_PASSWORD="password"
DB_ROOT_PASSWORD="root_password"

sed -i "s/HOST=localhost/HOST=$IP/g" .env
sed -i "s/DB_PASSWORD=password/DB_PASSWORD=$DB_PASSWORD/g" .env
sed -i "s/DB_ROOT_PASSWORD=root_password/DB_ROOT_PASSWORD=$DB_ROOT_PASSWORD/g" .env
sed -i "s/APP_PORT=8895/APP_PORT=$APP_PORT/g" .env
sed -i "s/API_PORT=8085/API_PORT=$API_PORT/g" .env
sed -i "s/DB_PORT=3307/DB_PORT=$DB_PORT/g" .env

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
${DOCKER_COMPOSE_CMD} up --detach db
# hopefully enough time for even the slower systems
sleep 15

${DOCKER_COMPOSE_CMD} stop
# ${DOCKER_COMPOSE_CMD} run --rm -e DJANGO_SUPERUSER_PASSWORD="$PASSWORD" webserver createsuperuser --noinput --username "$USERNAME" --email "$EMAIL"

${DOCKER_COMPOSE_CMD} up --detach

sleep 5
${DOCKER_COMPOSE_CMD} run --rm php php artisan migrate
${DOCKER_COMPOSE_CMD} run --rm php php artisan db:seed
${DOCKER_COMPOSE_CMD} run --rm php php scripts/create_user.php $USERNAME $EMAIL $PASSWORD