# pull official base image
FROM node:20.3-slim

# set working directory
WORKDIR /var/www/html

# install app dependencies
COPY package.json package-lock.json ./
RUN npm install

# add app
COPY . .

# build the React app
RUN npm run build

# remove development dependencies
RUN npm prune --omit=dev

# port
EXPOSE 3000

# start the built app
CMD ["npm", "run", "serve"]
