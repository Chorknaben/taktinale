FROM choros

RUN apt-get install nodejs

RUN git clone https://github.com/Chorknaben/taktinale /taktinale
RUN git clone https://github.com/Chorknaben/taktinale-frontend /taktinale/assets

EXPOSE 10010
ENTRYPOINT ["/usr/bin/nodejs", "/taktinale/app.js"]