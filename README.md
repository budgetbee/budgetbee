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


## Installation

BudgetBee is installed via docker-compose, if you want to do an installation from e.g. Portainer, copy the [`/docker/compose` file](https://github.com/budgetbee/budgetbee/tree/main/docker/docker-compose.yml) file, populate the variables and deploy it in your portainer application.

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
