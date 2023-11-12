# pull official base image
FROM node:21-slim

# set working directory
WORKDIR /var/www/html

# add app
COPY . .

# install app dependencies
RUN rm -rf node_modules
# COPY package.json package-lock.json ./
RUN npm ci


# port
EXPOSE 3000

# start app
CMD ["npm", "start"]
