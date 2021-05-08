function formatAddress(address) {
  if (!address) {
    return {};
  }

  return {
    id: address._id,
    address: address.streetLine1,
    city: address.city,
    state: address.state,
    location: address.location,
    mobileNumber: address.mobileNumber,
    owner: address.owner
  };
}

function formatUser(user) {
  if (!user) {
    return {};
  }

  return {
    _id: user._id,
    email: user.email,
    name: user.name,
    dateOfBirth: user.dateOfBirth,
    ageRange: user.ageRange,
    sex: user.sex,
    isActive: user.isActive,
    blacklist: user.blacklist || [],
    favourites: user.favourites,
    interests: user.interests,
    city: user.city,
    picture: user.picture,
    notification: user.notification
  };
}

module.exports = {
  formatAddress: formatAddress,
  formatUser: formatUser
};
