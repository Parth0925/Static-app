const expirySelect = document.getElementById('expirySelect');
const tableBody = document.querySelector('#optionTable tbody');

const UnderlyingScrip = 51; // SENSEX
const UnderlyingSeg = 'IDX_I';

//const BASE_URL = 'http://192.168.1.19:5001/api/expirylist';

function formatNumber(num) {
  return num !== undefined ? Number(num).toFixed(4) : '-';
}

// Load expiry dates on page load

//fetch('https://option-greeks-wlzo.onrender.com/api/expirylist', {
fetch('http://192.168.1.19:5001/api/expirylist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ UnderlyingScrip, UnderlyingSeg })
})
  .then(res => res.json())
  .then(data => {
    const expiryList = data.data;
    expiryList.forEach(date => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = date;
      expirySelect.appendChild(option);
    });

    // Load initial data
    if (expiryList.length > 0) {
      fetchOptionChain(expiryList[0]);
    }
  })
  .catch(err => console.error('Error fetching expiry list:', err));

// Handle expiry selection change
expirySelect.addEventListener('change', () => {
  const selectedExpiry = expirySelect.value;
  fetchOptionChain(selectedExpiry);
});

// Fetch and render option chain
function fetchOptionChain(expiry) {
  fetch('http://192.168.1.19:5001/api/optionchain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UnderlyingScrip, UnderlyingSeg, Expiry: expiry })
  })
    .then(res => res.json())
    .then(result => {
      const data = result.data.oc;
      const lastPrice = result.data.last_price;

      const allStrikes = Object.keys(data)
        .map(strike => parseFloat(strike))
        .sort((a, b) => a - b);

      // Find closest strike to underlying price
      const currentIndex = allStrikes.findIndex(strike => strike >= lastPrice);
      const start = Math.max(0, currentIndex - 15);
      const end = Math.min(allStrikes.length, currentIndex + 16);
      const filteredStrikes = allStrikes.slice(start, end);

      tableBody.innerHTML = '';

      filteredStrikes.forEach(strike => {
        const row = data[strike.toFixed(6)];
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatNumber(row.ce?.greeks?.vega)}</td>
          <td>${formatNumber(row.ce?.greeks?.delta)}</td>
          <td>${formatNumber(row.ce?.greeks?.theta)}</td>
          <td><strong>${parseInt(strike)}</strong></td>
          <td>${formatNumber(row.pe?.greeks?.theta)}</td>
          <td>${formatNumber(row.pe?.greeks?.delta)}</td>
          <td>${formatNumber(row.pe?.greeks?.vega)}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error('Error fetching option chain data:', err);
      tableBody.innerHTML = '<tr><td colspan="7">Failed to load data</td></tr>';
    });
}

