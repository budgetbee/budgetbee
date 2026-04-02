[![Server Tests](https://github.com/budgetbee/budgetbee/actions/workflows/server-tests.yml/badge.svg)](https://github.com/budgetbee/budgetbee/actions/workflows/server-tests.yml)
[![Build and Push Docker Image](https://github.com/budgetbee/budgetbee/actions/workflows/docker-build.yml/badge.svg)](https://github.com/budgetbee/budgetbee/actions/workflows/docker-build.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/budgetbee/budgetbee/badge)](https://www.codefactor.io/repository/github/budgetbee/budgetbee)

<p align="center">
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo.svg#gh-light-mode-only" width="50%" />
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/logo_dark.svg#gh-dark-mode-only" width="50%" />
</p>

<h3 align="center">Self-hosted personal finance management — track expenses, set budgets, and gain full control over your money.</h3>

---

## What is BudgetBee?

BudgetBee is an **open-source, self-hosted personal finance manager** designed to give you complete ownership of your financial data. Instead of relying on third-party cloud services, BudgetBee runs entirely on your own infrastructure via Docker, keeping your sensitive financial information private and under your control.

Whether you want to track day-to-day expenses, plan monthly budgets, monitor upcoming bills, or get a high-level view of your financial health through charts and reports — BudgetBee brings all of that into one clean, intuitive interface.

### Key highlights

- **Transaction tracking** — Log income, expenses, and transfers across multiple accounts. Organize records with customizable categories and sub-categories so your finances are always neatly classified.
- **Budget management** — Define spending budgets per category and monitor your progress in real time to avoid overspending.
- **Accounts & net worth** — Manage multiple accounts (checking, savings, cash, investments, etc.) and get an at-a-glance overview of your total net worth.
- **Upcoming expenses** — Schedule and track recurring or future expenses so you are never caught off guard by a bill.
- **Reports & charts** — Visualize your spending patterns, income vs. expenses, and category breakdowns through rich interactive charts.
- **Multi-user support** — Create separate accounts for family members or housemates, each with their own data and settings.
- **Multi-currency** — Work with multiple currencies, making BudgetBee suitable for users who travel or manage finances in more than one country.
- **Import from Excel / JSON** — Migrate your existing records easily by importing data from spreadsheets or JSON files.
- **API access** — Interact with your data programmatically through a REST API secured with API keys.
- **100% self-hosted** — Deploy with a single `docker-compose` command. Your data never leaves your server.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel (PHP) |
| Frontend | React + Vite + Tailwind CSS |
| Database | MySQL / MariaDB |
| Deployment | Docker & Docker Compose |

---

## Disclaimer

- ⚠️ The project is under **very active** development.
- ⚠️ Expect bugs and breaking changes.
- ⚠️ **Do not use this application as your only record of finances until a stable v1.0.0 is released.**

<p align="center">
<img src="https://github.com/budgetbee/budgetbee/raw/main/web/assets/images/budgetbee_screenshot.webp" width="100%" />
</p>

If you want to support this project, you can!

<a href="https://bmc.link/alejandrork" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 37px !important;width: 170px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Installation

BudgetBee is installed via Docker Compose. Copy the snippet below, fill in the environment variables, and run `docker-compose up -d`.

```yaml
version: '3.8'
services:
  nginx:
    image: ghcr.io/budgetbee/budgetbee/proxy:latest
    command: nginx -g "daemon off;"
    ports:
      - "${APP_PORT}:80" # Port exposed on the host, e.g. 80 -> http://localhost
    depends_on:
      - webserver
      - web
    restart: unless-stopped
    networks:
      - skynet
  webserver:
    image: ghcr.io/budgetbee/budgetbee/api:latest
    working_dir: /var/www/html
    command: sh entrypoint.sh
    environment:
      DB_HOST: db
      DB_DATABASE: ${DB_DATABASE}   # Name of the MySQL database (e.g. budgetbee)
      DB_USERNAME: ${DB_USERNAME}   # MySQL user the app connects with (e.g. budgetbee)
      DB_PASSWORD: ${DB_PASSWORD}   # Password for the MySQL app user - use a strong value
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - skynet
  web:
    image: ghcr.io/budgetbee/budgetbee/web:latest
    restart: unless-stopped
    networks:
      - skynet
  db:
    image: mysql:8.2.0
    command: --default-authentication-plugin=mysql_native_password
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD} # MySQL root password - keep this secret
      MYSQL_DATABASE: ${DB_DATABASE}           # Must match DB_DATABASE above
      MYSQL_USER: ${DB_USERNAME}               # Must match DB_USERNAME above
      MYSQL_PASSWORD: ${DB_PASSWORD}           # Must match DB_PASSWORD above
    healthcheck:
      test: ["CMD", "/usr/bin/mysql", "--user=${DB_USERNAME}", "--password=${DB_PASSWORD}", "--execute", "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${DB_DATABASE}';"]
      timeout: 20s
      retries: 100
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

## Getting Started

Once all containers are up and running, open the application in your browser. If no users exist yet, you will be automatically redirected to the registration page where you can create your first admin account by entering your name, email, and password.

After registering, you will be redirected to the login page to sign in with your new credentials.

## Roadmap

| Feature | Status |
| ----------------------------------------------- | ------ |
| Import records from Excel / JSON                | ✅ Done |
| Multi-user support                              | ✅ Done |
| Built-in currency support                       | ✅ Done |
| Custom currencies                               | 🔜 Planned |
| Create / edit categories                        | ✅ Done |
| Budgets per category                            | ✅ Done |
| Reports page                                    | ✅ Done |
| Upcoming expenses page                          | ✅ Done |
| Automation rules                                | 🔜 Planned |
| Bank integrations                               | 🔜 Planned |
| Export / backup                                 | 🔜 Planned |
| Customizable dashboard                          | 🔜 Planned |

## Updates

To upgrade BudgetBee to the latest version, rebuild your Docker Compose images and recreate the containers:

```bash
docker-compose up -d --build
```

## Documentation

This section is currently under development.

## Contributing

Contributions are welcome! Feel free to open a pull request or start a discussion in the issues section.

## Bugs

For bugs please [open an issue](https://github.com/budgetbee/budgetbee/issues)
