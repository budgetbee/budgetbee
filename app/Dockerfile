# pull official base image
FROM node:18.7

# set working directory
WORKDIR /var/www/html

# install app dependencies
COPY package.json package-lock.json ./

# add app
COPY . .

# port
EXPOSE 3000

# start app
CMD ["npm", "start"]