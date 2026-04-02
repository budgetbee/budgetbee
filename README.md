[![Server Tests](https://github.com/budgetbee/budgetbee/actions/workflows/server-tests.yml/badge.svg)](https://github.com/budgetbee/budgetbee/actions/workflows/server-tests.yml)
[![Build and Push Docker Image](https://github.com/budgetbee/budgetbee/actions/workflows/docker-build.yml/badge.svg)](https://github.com/budgetbee/budgetbee/actions/workflows/docker-build.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/budgetbee/budgetbee/badge)](https://www.codefactor.io/repository/github/budgetbee/budgetbee)

<p align="center">
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo.svg#gh-light-mode-only" width="50%" />
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo_dark.svg#gh-dark-mode-only" width="50%" />
</p>

<h3 align="center">BudgetBee is a personal finance management system.</h3>

## Disclaimer

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

## Getting Started

Once all containers are up and running, open the application in your browser. If no users exist yet, you will be automatically redirected to the registration page where you can create your first admin account by entering your name, email, and password.

After registering, you will be redirected to the login page to sign in with your new credentials.

## Roadmap

| Features                                     | Done |
| -------------------------------------------- | ------ |
| Import records Excel/Json                      | ✅    | 
| Create multiple users                        | ✅    |
| Create currencies                            | ✅    |
| Add custom currencies                        |      |
| Create/Edit Categories                       | ✅    |
| Budgets by category                          | ✅    |
| Create report page                           | ✅    |
| Create upcoming expenses page                | ✅    |
| Create rules                                 |     |
| Connect with banks                           |     |
| Export banckup                               |     |
| Customize dashboard                          |     |


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
