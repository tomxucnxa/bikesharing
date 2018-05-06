/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Transaction Processor Functions for bikesharing-network.
 */

'use strict';

// It's corresponding to the enum BikeStatus in the model file.
const BikeStatus = {
    INSTORE:    'INSTORE',
    INUSE:      'INUSE', 
    AVAILABLE:  'AVAILABLE',
    CALLBACK:   'CALLBACK'
};

/**
 * Processor function for BikeReleaseTransaction
 * @param {org.bikesharing.biznet.BikeReleaseTransaction} tx
 * @transaction
 */
async function processBikeReleaseTransaction(tx) {
    if (tx.bike.status === BikeStatus.INUSE) {
        throw new Error('You cannot release a bike which is already "INUSE"');
    }
    checkCurrentParticipant(tx.bike.provider);
    tx.bike.status = BikeStatus.AVAILABLE;
    await updateBike(tx.bike);
    emitTransanstionEvent(tx);
}

/**
 * Processor function for BikeCallbackTransaction
 * @param {org.bikesharing.biznet.BikeCallbackTransaction} tx
 * @transaction
 */
async function processBikeCallbackTransaction(tx) {
  console.info(tx.participantInvoking)
    checkCurrentParticipant(tx.bike.provider);
    // We can callback bikes of all status.
    tx.bike.status = BikeStatus.CALLBACK;
    await updateBike(tx.bike);
    emitTransanstionEvent(tx);
}

/**
 * Processor function for BikeRentTransaction
 * @param {org.bikesharing.biznet.BikeRentTransaction} tx
 * @transaction
 */
async function processBikeRentTransaction(tx) {
    let currParticipant = getCurrentParticipant();
    if (tx.bike.status !== BikeStatus.AVAILABLE) {
        throw new Error('You cannot rent a bike which is not "AVAILABLE"');
    }

    // Change bike status and active user accordingly.
    tx.bike.status = BikeStatus.INUSE;
    tx.bike.activeUser = currParticipant;

    // Add bike to user's active bikes list.
    if (currParticipant.activeBikeIds === undefined) {
        currParticipant.activeBikeIds = [];
    }
    currParticipant.activeBikeIds.push(tx.bike.getFullyQualifiedIdentifier());

    await updateBike(tx.bike);
    await updateBikeUser(currParticipant);
    emitTransanstionEvent(tx);
}

/**
 * Processor function for BikeReturnTransaction
 * @param {org.bikesharing.biznet.BikeReturnTransaction} tx
 * @transaction
 */
async function processBikeReturnTransaction(tx) {
    let currParticipant = checkCurrentParticipant(tx.bike.activeUser);

    // Change bike status and active user accordingly.
    tx.bike.status = BikeStatus.AVAILABLE;
    tx.bike.activeUser = undefined;

    // Remove bike from user's active bikes list.
    if (currParticipant.activeBikeIds !== undefined) {
        currParticipant.activeBikeIds = currParticipant.activeBikeIds.filter(b => b !== tx.bike.getFullyQualifiedIdentifier());
    }

    await updateBike(tx.bike);
    await updateBikeUser(currParticipant);
    emitTransanstionEvent(tx);
}

function checkCurrentParticipant(operPart) {
    let currParticipant = getCurrentParticipant();
    if(currParticipant === undefined || operPart === undefined) {
        throw new Error('There is at least one participant to be verified is null.');
    }
    if (currParticipant.getFullyQualifiedIdentifier() !== operPart.getFullyQualifiedIdentifier()) {
        throw new Error(`The participants ${currParticipant.getFullyQualifiedIdentifier()} - ${operPart.getFullyQualifiedIdentifier()} are not matched.`);
    }
    return currParticipant;
}

/**
 * 
 * @param {org.bikesharing.biznet.Bike} bike
 */
async function updateBike(bike) {
    // Get the asset registry for the bikes.
    const assetRegistry = await getAssetRegistry('org.bikesharing.biznet.Bike');
    // Update the bike status in the bikes registry.
    // All data validating will be handled before calling this method.
    await assetRegistry.update(bike);
}

/**
 * 
 * @param {org.bikesharing.biznet.BikeUser} bikeUser
 */
async function updateBikeUser(bikeUser) {
    // Get the participant registry for the bike users.
    const partRegistry = await getParticipantRegistry('org.bikesharing.biznet.BikeUser');
    // Update the bike user in the registry.
    // All data validating will be handled before calling this method.
    await partRegistry.update(bikeUser);
}

function emitTransanstionEvent(tx) {
    let factory = getFactory();
    let e = factory.newEvent('org.bikesharing.biznet', 'BikeEvent');
    e.bike = tx.bike;
    e.time = tx.time;
    e.transactionId = tx.getFullyQualifiedIdentifier();
    emit(e);
}