import https from 'https';
https.get('https://raw.githubusercontent.com/smrnjeet222/UnDraw-Illustrations/master/undraw_time_management_30iu.svg', (res) => {
  console.log(res.statusCode);
});
