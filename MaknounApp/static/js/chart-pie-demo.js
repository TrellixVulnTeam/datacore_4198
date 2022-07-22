// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';
Chart.defaults.global.animation.duration = 2000;
// Pie Chart Example
var ctx = document.getElementById("myPieChart");
var myPieChart = new Chart(ctx, {
  type: 'pie',
  data: {
    labels: [ "الفنادق", "الأسفار", "الاتصالات", "الأفراد"],
    datasets: [{
      data: [12.21, 15.58, 11.25, 8.32],
      backgroundColor: ['#78caff', '#ff9696', '#ffbf66', '#68d7c5'],
    }],
  },
  responsive:true,
  options: {
    animation: {
        duration: 2000,
    }
  }
});
