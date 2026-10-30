# eduSmart Java code execution image
#
# This is OPTIONAL. By default, CodeExecutionService runs code inside the public
# "openjdk:21-jdk-slim" image, which works out of the box after `docker pull openjdk:21-jdk-slim`.
#
# Building this image instead gives you a non-root execution user, which is a small
# extra safety margin for an academic demo. To use it:
#
#   docker build -t edusmart-java-runner -f backend/docker/java-runner/Dockerfile backend/docker/java-runner
#   set DOCKER_JAVA_IMAGE=edusmart-java-runner   (Windows)
#   export DOCKER_JAVA_IMAGE=edusmart-java-runner (macOS/Linux)
#
# and restart the backend so it picks up the new image name (see application.yml -> app.docker.image).

FROM openjdk:21-jdk-slim

# Run submitted code as a low-privilege, non-root user instead of root.
RUN useradd --no-create-home --shell /usr/sbin/nologin runner
USER runner

WORKDIR /workspace
