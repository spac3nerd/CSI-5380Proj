var currentUsers = 0;
var maxUsers = undefined;
var userTokens = {};

function addUser() {
    currentUsers += 1;
}

function getUserCount() {
    return currentUsers;
}

function setMaxUsers(m) {
    maxUsers = m;
}

function spaceAvailable() {
    return currentUsers < maxUsers;
}

function setUserTokens(newUserTokens) {
    userTokens = newUserTokens;
}

function getUserTokens() {
    return userTokens;
}
function isTokenValid(token) {
    return userTokens.hasOwnProperty(token);
}


module.exports = {
    addUser: addUser,
    getUserCount: getUserCount,
    setMaxUsers: setMaxUsers,
    spaceAvailable: spaceAvailable,
    setUserTokens: setUserTokens,
    getUserTokens: getUserTokens,
    isTokenValid: isTokenValid
};