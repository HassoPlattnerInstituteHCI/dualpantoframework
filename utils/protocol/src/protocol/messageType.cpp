#include "protocol/messageType.hpp"

std::set<MessageType> TrackedMessageTypes = {
    CREATE_OBSTACLE,
    ADD_TO_OBSTACLE,
    REMOVE_OBSTACLE,
    ENABLE_OBSTACLE,
    DISABLE_OBSTACLE,
    CREATE_PASSABLE_OBSTACLE,
    CREATE_RAIL};
