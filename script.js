// =============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// =============================================================
let dashboardData = null;
let salesChart = null; // Храним ссылку на график
let map = null; // Храним ссылку на карту
let currentFilters = {
  region: 'all',
  district: 'all'
};

// =============================================================
// ЗАГРУЗКА ДАННЫХ
// =============================================================
async function loadData() {
  try {
    const cacheBuster = Date.now();
    const response = await fetch(`data.json?t=${cacheBuster}`);
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные');
    }
    const data = await response.json();
    dashboardData = data;
    console.log('✅ Данные успешно загружены');
    return data;
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    return null;
  }
}

// =============================================================
// ФИЛЬТРАЦИЯ ДАННЫХ (по региону и округу)
// =============================================================
function filterData(data, filters) {
  return data.filter(item => {
    const regionMatch = filters.region === 'all' || item.region === filters.region;
    const districtMatch = filters.district === 'all' || item.district === filters.district;
    return regionMatch && districtMatch;
  });
}

// =============================================================
// ОБНОВЛЕНИЕ KPI (на основе отфильтрованных данных)
// =============================================================
function updateKPI(filteredData) {
  if (!filteredData || filteredData.length === 0) {
    document.getElementById('revenue').textContent = '0 ₽';
    document.getElementById('orders').textContent = '0';
    document.getElementById('avgCheck').textContent = '0 ₽';
    document.getElementById('conversion').textContent = '0%';
    return;
  }

  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSales = filteredData.reduce((sum, item) => sum + item.sales, 0);
  const avgCheck = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  const conversion = totalRevenue > 0 ? (totalSales / filteredData.length) * 100 : 0;

  document.getElementById('revenue').textContent = totalRevenue.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('orders').textContent = totalSales.toLocaleString('ru-RU');
  document.getElementById('avgCheck').textContent = avgCheck.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('conversion').textContent = conversion.toFixed(1) + '%';
}

// =============================================================
// ОБНОВЛЕНИЕ ГРАФИКА
// =============================================================
function updateChart(filteredData) {
  const ctx = document.getElementById('salesChart').getContext('2d');
  const canvasParent = ctx.canvas.parentElement;
  canvasParent.style.height = '300px';
  canvasParent.style.width = '100%';

  if (salesChart) {
    salesChart.destroy();
  }

  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const salesData = [320, 280, 390, 450, 410, 520, 580, 610, 560, 490, 530, 620];

  const totalRevenue = filteredData.reduce((sum, item) => sum + item.revenue, 0);
  const multiplier = totalRevenue > 0 ? totalRevenue / 3842500 : 1;
  const scaledData = salesData.map(val => Math.round(val * multiplier));

  salesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Выручка (тыс. ₽)',
        data: scaledData,
        backgroundColor: 'rgba(42, 92, 138, 0.7)',
        borderColor: '#2A5C8A',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: '#FF6B6B',
        hoverBorderColor: '#FF6B6B',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#1E293B',
            font: { family: 'Inter', size: 12, weight: '500' },
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.parsed.y + ' тыс. ₽';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { family: 'Inter', size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
}

// =============================================================
// ОБНОВЛЕНИЕ ТАБЛИЦЫ
// =============================================================
function renderTable(data, filters) {
  const tbody = document.getElementById('tableBody');
  const filteredData = filterData(data, filters);

  let html = '';
  filteredData.forEach(item => {
    html += `
      <tr>
        <td>${item.manager}</td>
        <td>${item.region}</td>
        <td>${item.district || '-'}</td>
        <td>${item.sales}</td>
        <td>${item.revenue.toLocaleString('ru-RU')}</td>
      </tr>
    `;
  });

  if (filteredData.length === 0) {
    html = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--color-text-muted);">Нет данных для выбранных фильтров</td></tr>`;
  }

  tbody.innerHTML = html;
  return filteredData;
}

// =============================================================
// КАРТА (Leaflet)
// =============================================================
function initMap() {
  // Проверяем, есть ли уже карта
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  if (map) {
    map.remove();
    map = null;
  }

  // Координаты регионов России
  const regionCoordinates = {
    'Москва': [55.7558, 37.6173],
    'СПб': [59.9343, 30.3351],
    'Казань': [55.7887, 49.1221],
    'Новосибирск': [55.0084, 82.9357],
    'Екатеринбург': [56.8389, 60.6057],
    'Краснодар': [45.0355, 38.9755],
    'Красноярск': [56.0113, 92.8538]
  };

  map = L.map('map').setView([61.5240, 80.3180], 3);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  if (!dashboardData) return;

  const managers = dashboardData.managers;
  const filteredData = filterData(managers, currentFilters);

  const regionSales = {};
  filteredData.forEach(item => {
    if (regionSales[item.region]) {
      regionSales[item.region] += item.revenue;
    } else {
      regionSales[item.region] = item.revenue;
    }
  });

  Object.keys(regionSales).forEach(region => {
    const coords = regionCoordinates[region];
    if (coords) {
      const revenue = regionSales[region];
      const radius = Math.max(8, Math.min(30, revenue / 15000));

      L.circle(coords, {
        color: '#2A5C8A',
        fillColor: '#FF6B6B',
        fillOpacity: 0.7,
        radius: radius * 2000
      }).addTo(map)
      .bindPopup(`
        <b>${region}</b><br>
        Выручка: ${revenue.toLocaleString('ru-RU')} ₽
      `);
    }
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

// =============================================================
// ПРИМЕНЕНИЕ ВСЕХ ФИЛЬТРОВ (глобальное обновление)
// =============================================================
function applyAllFilters() {
  if (!dashboardData) return;

  const managers = dashboardData.managers;
  const filteredData = filterData(managers, currentFilters);

  renderTable(managers, currentFilters);
  updateKPI(filteredData);
  updateChart(filteredData);
  initMap(); // Обновляем карту
}

// =============================================================
// ЭКСПОРТ ДАННЫХ В CSV
// =============================================================
function exportToCSV() {
  if (!dashboardData) {
    alert('Данные ещё не загружены');
    return;
  }

  const managers = dashboardData.managers;
  const filteredData = filterData(managers, currentFilters);

  if (filteredData.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  let csv = 'Менеджер,Регион,Округ,Продажи (шт.),Выручка (₽)\n';
  filteredData.forEach(item => {
    csv += `${item.manager},${item.region},${item.district || '-'},${item.sales},${item.revenue}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `sales_data_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// =============================================================
// ПЕРЕКЛЮЧЕНИЕ ТЁМНОЙ ТЕМЫ
// =============================================================
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }

  localStorage.setItem('theme', newTheme);
}

// =============================================================
// ИНИЦИАЛИЗАЦИЯ ДАШБОРДА
// =============================================================
async function initDashboard() {
  const data = await loadData();

  if (data) {
    dashboardData = data;
    applyAllFilters();
  } else {
    console.warn('⚠️ Использую локальные данные (запасной вариант)');
    dashboardData = {
      managers: [
        { manager: "Иванов А.", region: "Москва", district: "Центральный", sales: 145, revenue: 435000 },
        { manager: "Петров В.", region: "СПб", district: "Северо-Западный", sales: 98, revenue: 294000 },
        { manager: "Сидоров К.", region: "Казань", district: "Приволжский", sales: 76, revenue: 228000 }
      ]
    };
    applyAllFilters();
  }
}

// =============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// =============================================================
document.addEventListener('DOMContentLoaded', async function() {
  // Текущая дата
  const dateEl = document.getElementById('currentDate');
  const now = new Date();
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('ru-RU', options);

  // Восстанавливаем тему
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Инициализация
  await initDashboard();

  // Фильтр по регионам
  const regionFilter = document.getElementById('regionFilter');
  if (regionFilter) {
    regionFilter.addEventListener('change', (e) => {
      currentFilters.region = e.target.value;
      applyAllFilters();
    });
  }

  // Фильтр по округам
  const districtFilter = document.getElementById('districtFilter');
  if (districtFilter) {
    districtFilter.addEventListener('change', (e) => {
      currentFilters.district = e.target.value;
      applyAllFilters();
    });
  }

  // Кнопка сброса
  const resetBtn = document.getElementById('resetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (regionFilter) regionFilter.value = 'all';
      if (districtFilter) districtFilter.value = 'all';
      currentFilters = { region: 'all', district: 'all' };
      applyAllFilters();
    });
  }

  // Кнопка экспорта CSV
  const exportBtn = document.getElementById('exportCSV');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV);
  }
});
