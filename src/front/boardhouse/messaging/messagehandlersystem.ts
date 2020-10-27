import { IBoardHouseFront } from "../engine/interfaces";
import { PlayerMessage } from "../../../packets/playermessage";
import { EntityMessage } from "../../../packets/entitymessage";
import { EntityEventTypes } from "../../../packets/entityeventtypes";

export function messageHandlerSystem(boardHouseFront: IBoardHouseFront) {
    boardHouseFront.connection.onmessage = function(messageEvent: MessageEvent) {
        const message: EntityMessage = JSON.parse(messageEvent.data);
        console.log("boardhouse: back to front message");

        if (message.eventType === EntityEventTypes.CREATE_OR_UPDATE) {
            createOrUpdateEntity(message, boardHouseFront);
        }
    }
}

// TODO: implement this!!
function createOrUpdateEntity(message: EntityMessage, boardHouseFront: IBoardHouseFront) {
    console.log("create entity front");
    console.log(message.data);
}

// TODO: implement!!
function destroyEntity() {

}