[![Server Tests](https://github.com/budgetbee/budgetbee/actions/workflows/server-tests.yml/badge.svg)](https://github.com/budgetbee/budgetbee/actions/workflows/server-tests.yml)
[![Build and Push Docker Image](https://github.com/budgetbee/budgetbee/actions/workflows/docker-build.yml/badge.svg)](https://github.com/budgetbee/budgetbee/actions/workflows/docker-build.yml)


<p align="center">
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo.svg#gh-light-mode-only" width="50%" />
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo_color_2.svg#gh-dark-mode-only" width="50%" />
</p>

# BudgetBee

BudgetBee is a personal budget system

### Disclaimer

- ⚠️ The project is under **very active** development.
- ⚠️ Expect bugs and breaking changes.
- ⚠️ **Important, do not use this application as the only app to record your finances until you have a stable version v1.0.0.**

<p align="center">
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/budgetbee_screenshot.webp" width="100%" />
</p>

If you want to contribute to this project, you can!

<a href="https://bmc.link/alejandrork" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 37px !important;width: 170px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Installation

BudgetBee is installed via docker-compose, if you want to do an installation from e.g. Portainer, copy the [`/docker/compose` file](https://github.com/budgetbee/budgetbee/tree/main/docker/docker-compose.yml) file, populate the variables and deploy it in your portainer application.

Copy the following code to install BudgetBee

```bash
version: '3'
services:
  nginx:
    image: ghcr.io/budgetbee/budgetbee/proxy:latest
    command: nginx -g "daemon off;"
    ports:
      - "8201:80"
    restart: unless-stopped
    networks:
      - skynet

  webserver:
    image: ghcr.io/budgetbee/budgetbee/api:latest
    working_dir: /var/www/html
    command: sh entrypoint.sh
    environment:
      DB_HOST: db
      DB_DATABASE: "budgetbee"
      DB_USERNAME: "budgetbee_user"
      DB_PASSWORD: "budgetbee_password"
    restart: unless-stopped
    networks:
      - skynet

  web:
    image: ghcr.io/budgetbee/budgetbee/web:latest
    restart: unless-stopped
    networks:
      - skynet

  db:
    image: mysql:8
    command: --default-authentication-plugin=mysql_native_password
    environment:
      MYSQL_ROOT_PASSWORD: "budgetbee_password_root"
      MYSQL_DATABASE: "budgetbee"
      MYSQL_USER: "budgetbee_user"
      MYSQL_PASSWORD: "budgetbee_password"
    restart: unless-stopped
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - skynet

networks:
  skynet:

volumes:
  db_data:
```
### Important
**Wait around 30 seconds after all containers are up to execute the create user command**

To create a user, run this command from your local machine, substituting the values with the ones you want
```bash
docker exec budgetbee-webserver-1 php scripts/create_user.php <your_name> <your_email> <your_password>
```


## Updates

To upgrade your BudgetBee application to the latest version, rebuild your docker-compose images and re-upload the containers.
This can be done easily by:
```bash
docker-compose up -d --build
```

## Documentation

This section is currently under development

## Contributing

If you would like to collaborate with BudgetBee, you can do so by

## Bugs

For bugs please [open an issue](https://github.com/budgetbee/budgetbee/issues)
