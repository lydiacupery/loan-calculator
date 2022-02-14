FROM node:12-alpine


# ADD --chown=node:node package.json /usr/src/app/
# ADD --chown=node:node yarn.lock /usr/src/app/

# RUN mkdir -p /usr/src/app
# RUN chown -R node: /usr/src/app

# USER node
# WORKDIR /usr/src/app/

# RUN yarn install

# ADD . /usr/src/app/

# RUN NODE_ENV=production yarn build

# USER root
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY yarn.lock ./

RUN yarn install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3001 
# RUN SOURCE .env
RUN NODE_ENV=production yarn build

