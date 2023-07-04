<p align="center">
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo.png" width="50%" />
</p>

# BudgetBee

BudgetBee is a personal budget system

### Disclaimer

- ⚠️ The project is under **very active** development.
- ⚠️ Expect bugs and breaking changes.
- ⚠️ **Important, do not use this application as the only app to record your finances until you have a stable version v1.0.0.**


## Installation
The easiest way to install BudgetBee is by using an installation script. Just run the following command and follow the installation steps

```bash
bash -c "$(curl -L https://raw.githubusercontent.com/budgetbee/budgetbee/main/install.sh)"
```

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
