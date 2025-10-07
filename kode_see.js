const response = pm.response.json();

if (response.data && response.data.length > 0) {
  pm.visualizer.set(`
    <table border="1" cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:left;">
      <tr style="background-color:#e0e0e0;">
        <th>City</th>
        <th>Temperature (°C)</th>
        <th>Last Update (SEE)</th>
        <th>Status</th>
      </tr>
      ${response.data
        .map(
          (d) => `
        <tr>
          <td>${d.city}</td>
          <td>${d.temperature}</td>
          <td>${new Date(d.updated_at).toLocaleString()}</td>
          <td>🟢 Updated</td>
        </tr>`
        )
        .join("")}
    </table>
  `);
} else {
  pm.visualizer.set("<p style='color:red;'>⚠️ No temperature data found.</p>");
}
