FROM choros

RUN npm install -g sails

RUN git clone https://github.com/Chorknaben/taktinale /taktinale
RUN git clone https://github.com/Chorknaben/taktinale-frontend /taktinale/assets

EXPOSE 10010
WORKDIR taktinale
ENTRYPOINT ["/usr/bin/sails", "lift"]