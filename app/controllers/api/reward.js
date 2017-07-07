const shortCode = require('shortid');
const Booking = require('../../models/reward');

module.exports = {
    getCode: function (req, res) {
        let valid = false;
        let code = shortCode.generate();

        // while(!valid) {
        //     Booking.find({shortCode: code}, function (err, booking) {
        //         if (err) {
        //             res.status(500).send(err);
        //         } else if (!booking) {
        //             booking = new Booking({
        //                 userId: 'req.user._id',
        //                 rewardId: req.body.rewardId,
        //                 shortCode: code
        //             });

        //             booking.save(function (err) {
        //                 if (err) {
        //                     res.status(500).send(err);
        //                 } else {
        //                     valid = true;
        //                 }
        //             });
        //         }
        //     });
        // }

        res.status(200).send({'code': code});
    }
};