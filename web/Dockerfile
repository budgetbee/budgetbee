# Use a minimal, frequently patched Node.js image as the base
FROM cgr.dev/chainguard/node:latest-dev

# Set the working directory inside the container
WORKDIR /var/www/html

# Copy package.json and package-lock.json to the container
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY --chown=node:node . .

# Ensure all dependencies are built correctly
RUN npm rebuild

# Expose the port the app will run on
EXPOSE 3000

# Build the application
RUN npm run build

# Start the app
ENTRYPOINT ["npm"]
CMD ["run", "start"]
