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
    tx.bike.status = BikeStatus.AVAILABLE;
    await updateBike(tx.bike)
}

/**
 * Processor function for BikeCallbackTransaction
 * @param {org.bikesharing.biznet.BikeCallbackTransaction} tx
 * @transaction
 */
async function processBikeCallbackTransaction(tx) {
    tx.bike.status = BikeStatus.CALLBACK;
    await updateBike(tx.bike)
}

/**
 * Processor function for BikeRentTransaction
 * @param {org.bikesharing.biznet.BikeRentTransaction} tx
 * @transaction
 */
async function processBikeRentTransaction(tx) {
    tx.bike.status = BikeStatus.INUSE;
    await updateBike(tx.bike)
}

/**
 * Processor function for BikeReturnTransaction
 * @param {org.bikesharing.biznet.BikeReturnTransaction} tx
 * @transaction
 */
async function processBikeReturnTransaction(tx) {
    tx.bike.status = BikeStatus.AVAILABLE;
    await updateBike(tx.bike);
}

/**
 * 
 * @param {org.bikesharing.biznet.Bike} bike
 */
async function updateBike(bike) {
    // Get the asset registry for the bikes.
    const assetRegistry = await getAssetRegistry('org.bikesharing.biznet.Bike');
    // Update the bike status in the bikes registry.
    // In this easy implementation, only the status will be considered and processed, 
    // the availability, permission, charging and others are ignored now.
    await assetRegistry.update(bike);
}
