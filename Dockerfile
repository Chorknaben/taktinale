FROM choros

RUN npm install -g sails

#RUN git clone https://github.com/Chorknaben/taktinale /taktinale
#RUN git clone https://github.com/Chorknaben/taktinale-frontend /taktinale/assets
COPY . /taktinale

RUN cd /taktinale && npm install
RUN cd /taktinale/assets && npm install
COPY config/taktinale.js /taktinale/config/taktinale.js

ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 10010
WORKDIR taktinale
ENTRYPOINT ["/usr/bin/sails", "lift", "--prod", "--verbose"]
