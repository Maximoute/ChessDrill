# dev/livereload/Dockerfile
FROM node:20-alpine
RUN npm i -g livereload
WORKDIR /site
# Observe /site et expose sur 35729
CMD ["livereload", "/site", "-p", "35729", "-d", "true"]
