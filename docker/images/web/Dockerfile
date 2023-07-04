# pull official base image
FROM node:20.3-slim

# set working directory
WORKDIR /var/www/html

# install app dependencies
COPY package.json package-lock.json ./
RUN npm install

# add app
COPY ../../../web .

# port
EXPOSE 3000

# start app
CMD ["npm", "start"]
