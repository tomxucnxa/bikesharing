// For client testing.

'use strict';

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

class BikeSharingCliTest {

    constructor(cardName) {
        this.cardName = cardName;
        this.bizNetworkConnection = new BusinessNetworkConnection();
    }

    async init() {
        console.info('Connecting to the chain with cardname ' + this.cardName);
        this.businessNetworkDefinition = await this.bizNetworkConnection.connect(this.cardName);
        console.info('BusinessNetworkDefinition obtained', this.businessNetworkDefinition.getIdentifier());
    }

    /** Listen for the sale transaction events
     */
    async listen() {
        console.info('Listen...');
        this.bizNetworkConnection.on('event', (evt) => {
            console.log('Get an event >>>');
            console.log(evt.getFullyQualifiedIdentifier());
            console.log(evt.bike.getFullyQualifiedIdentifier());
            console.log(evt.time);
            console.log(evt.transactionId);
        });
    }

    /**
     * List the land titles that are stored in the Land Title Resgitry
     * @return {Promise} resolved when fullfiled will have listed out the titles to stdout
     */
    async listBikes() {
        console.info('Begin to get bikes');
        let registry = await this.bizNetworkConnection.getAssetRegistry('org.bikesharing.biznet.Bike');
        let allBikes = await registry.getAll();
        console.info(`Find ${allBikes.length} bikes`);
        allBikes.forEach(bike => {
            console.info('Bike: ', bike.aid, bike.getFullyQualifiedIdentifier());
        });
    }

    static async execute() {
        let help = 'node clitest.js <cardName> <command>';
        console.info('Begin to execute.');
        let  argv = process.argv.slice(2);
        let cardName = argv[0];
        if (!cardName) {
            console.info('No cardName is specified.');
            console.info(help);
            process.exit(1);
        }

        let cmd = argv[1];
        if (!cmd) {
            console.info('No command is specified.');
            console.info(help);
            process.exit(1);
        }

        let bsct = new BikeSharingCliTest(cardName);
        // It is very important to use 'await', since the called bsct.init() includes await promise features.
        await bsct.init();

        console.info('Init succeed')

        if (cmd === 'listen') {
            await bsct.listen();
        }
        else if(cmd === 'listBikes') {
            await bsct.listBikes();
            process.exit(0);
        }
        else {
            console.info('command not found.')
            process.exit(0);
        }
    }
}

try {
    BikeSharingCliTest.execute();
}
catch(e) {
    console.info(e);
}

module.exports = BikeSharingCliTest;
