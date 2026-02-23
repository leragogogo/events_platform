export function canonicalPair(userAId: string, userBId: string) {
    //const a = String(userAId);
    //const b = String(userBId);
    return userAId < userBId ?
        { userLowId: userAId, userHighId: userBId } :
        { userLowId: userBId, userHighId: userAId };
}