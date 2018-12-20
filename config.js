var config = {
    development: {
        //url to be used in link generation
        url: 'http://my.site.com',
        //mongodb connection settings
        database: {
            url: "mongodb://sejfyr42:lasersightsop14@ds231374.mlab.com:31374/sec-card-game-db"
           
        },
        //server details
        server: {
            host: 'localhost',
            port: '3001'
        }
    },
/*   production: {
        //url to be used in link generation
        url: 'http://my.site.com',
        //mongodb connection settings
        database: {
            host: '127.0.0.1',
            port: '27017',
            db:     'site'
        },
        //server details
        server: {
            host:   '127.0.0.1',
            port:   '3421'
        }
    <*/
    };
    module.exports = config;