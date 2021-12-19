import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)

export class MazeWorkerService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._mazeWorker = new Worker('./src/resources/workers/maze-worker.js');
        this._mazeWorker.onmessage = (event) => {
            if (event.data.message == 'faassenPositions' && event.data.positions.length) {
                this._eventAggregator.publish('faassenPositions', event.data.positions);
            }
        };
    }

    initMazeWorker(cells) {
        let workerData = {
            message: 'initMaze',
            cells: cells
        };
        this._mazeWorker.postMessage(workerData);
    }

    askPositionFaassen(position, targetPositions) {
        this._mazeWorker.postMessage({
            message: 'getPositionHalfway',
            position: position,
            targetPositions: targetPositions
        });
    }

}
