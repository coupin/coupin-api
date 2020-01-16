var xl = require('excel4node');
var find = require('lodash.find');

module.exports = function (data, cb) {
  var rewards = data.rewards;
  var ageDist = data.ageDist;
  var genderDist = data.genderDist;

  var wb = new xl.Workbook({
    dateFormat: 'MMM dd, yyyy',
  });
  
  var ws = wb.addWorksheet('Sheet 1');
  
  // initial setup
  var headerStyle = wb.createStyle({
    font: {
      color: '#000000',
      size: 11,
      bold: true,
    },
    alignment: {
      horizontal: 'center',
    },
    border: {
      left: {
        style: 'medium',
        color: '#000000',
      },
      right: {
        style: 'medium',
        color: '#000000',
      },
      top: {
        style: 'medium',
        color: '#000000',
      },
      bottom: {
        style: 'medium',
        color: '#000000',
      },
    }
  });
  
  var bodyStyle = wb.createStyle({
    font: {
      color: '#000000',
      size: 12,
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
    border: {
      left: {
        style: 'thin',
        color: '#000000',
      },
      right: {
        style: 'thin',
        color: '#000000',
      },
      top: {
        style: 'thin',
        color: '#000000',
      },
      bottom: {
        style: 'thin',
        color: '#000000',
      },
    }
  });
  
  /* Beginning of header styling */
  // first row
  ws.cell(3, 6, 3, 7, true).style(headerStyle);
  ws.cell(3, 8, 3, 9, true).style(headerStyle);
  ws.cell(3, 10, 3, 11, true).style(headerStyle);
  ws.cell(3, 12, 3, 16, true).style(headerStyle);
  ws.cell(3, 17, 3, 21, true).style(headerStyle);
  
  // second row
  ws.cell(4, 2, 4, 21).style(headerStyle);
  /* End of header styling */
  
  /* Header column width */
  ws.column(2).setWidth(9);
  ws.column(3).setWidth(35);
  ws.column(4).setWidth(15);
  ws.column(5).setWidth(15);
  
  for (var i = 6; i <= 11; i++) {
    ws.column(i).setWidth(15)
  }
  
  for (var i = 12; i <= 21; i++) {
    ws.column(i).setWidth(10)
  }
  /* End of header coumn width */
  
  /* Header Content */
  // first row
  ws.cell(3, 6).string('TOTAL COUPINS');
  ws.cell(3, 8).string('GENERATED COUPIN GENDER SPLIT');
  ws.cell(3, 10).string('REDEEMED COUPIN GENDER SPLIT');
  ws.cell(3, 12).string('AGE SPLIT-GENERATED COUPIN');
  ws.cell(3, 17).string('AGE SPLIT-REDEEMED COUPIN');
  
  // second row
  var i = 2;
  var subHeaders = [
    '#',
    'REWARD/PROMOTION NAME',
    'START DATE',
    'END DATE',
    'GENERATED',
    'REDEEMED',
    'MALE',
    'FEMALE',
    'MALE',
    'FEMALE',
    'BELOW 15',
    '15-24',
    '25-34',
    '35-45',
    '45+',
    'BELOW 15',
    '15-24',
    '25-34',
    '35-45',
    '45+'
  ];
  
  subHeaders.forEach(function (value) {
    ws.cell(4, i).string(value);
    i++;
  });
  
  /* End of header content */
  
  var j = 5;
  for (var i = 0, j = 5; i < rewards.length; i++ , j++) {
    ws.cell(j, 2, j, 21).style(bodyStyle);
    ws.row(j).setHeight(30);
    ws.cell(j, 2).number(i + 1);
    ws.cell(j, 3).string(rewards[i].name);
    ws.cell(j, 4).date(rewards[i].startDate);
    ws.cell(j, 5).date(rewards[i].endDate);
    ws.cell(j, 6).number(rewards[i].generatedCoupin);
    ws.cell(j, 7).number(rewards[i].redeemedCoupin);
  
    // gender coupin distribution
    var femaleCoupin = find(genderDist, { gender: 'female', rewardId: rewards[i]['_id'] }) || {};
    var maleCoupin = find(genderDist, { gender: 'male', rewardId: rewards[i]['_id'] }) || {};
    ws.cell(j, 8).number(maleCoupin.generatedCoupin || 0);
    ws.cell(j, 9).number(femaleCoupin.generatedCoupin || 0);
    ws.cell(j, 10).number(maleCoupin.redeemedCoupin || 0);
    ws.cell(j, 11).number(femaleCoupin.redeemedCoupin || 0);
  
    ['under 15', '15 - 25', '25 - 35', '35 - 45', 'above 45'].forEach(function (val, index) {
      var coupin = find(ageDist, { age: val, rewardId: rewards[i]['_id'] }) || {};
  
      var generatedCoupinIndex = 12 + index;
      var redeemedCoupinIndex = generatedCoupinIndex + 5;
  
      ws.cell(j, generatedCoupinIndex).number(coupin.generatedCoupin || 0);
      ws.cell(j, redeemedCoupinIndex).number(coupin.redeemedCoupin || 0);
    });
  }
  
  return wb.writeToBuffer();
}
