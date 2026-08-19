// =============================================================
// ЗАГРУЗКА ДАННЫХ ИЗ JSON-ФАЙЛА
// =============================================================

let dashboardData = null; // Глобальная переменная для данных

// Функция загрузки данных
async function loadData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные');
    }
    const data = await response.json();
    dashboardData = data;
    return data;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    // Показываем заглушку, если данные не загрузились
    return null;
  }
}

// =============================================================
// ИНИЦИАЛИЗАЦИЯ ДАШБОРДА ПОСЛЕ ЗАГРУЗКИ ДАННЫХ
// =============================================================

async function initDashboard() {
  // Загружаем данные
  const data = await loadData();
  
  if (data) {
    // Обновляем KPI
    document.getElementById('revenue').textContent = data.kpi.revenue.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('orders').textContent = data.kpi.orders.toLocaleString('ru-RU');
    document.getElementById('avgCheck').textContent = data.kpi.avgCheck.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('conversion').textContent = data.kpi.conversion + '%';
    
    // Рендерим таблицу с данными из JSON
    renderTable(data.managers, 'all');
    
    // Инициализируем график с данными из JSON
    initChart(data.chartData);
  } else {
    // Если данные не загрузились, используем локальные (запасной вариант)
    console.warn('Использую локальные данные');
    renderTable(managerData, 'all');
    initChart({ months: months, sales: salesData });
  }
}

// Изменяем функцию renderTable, чтобы принимать данные
function renderTable(data, regionFilter = 'all') {
  const tbody = document.getElementById('tableBody');
  
  // Используем переданные данные или глобальные
  const sourceData = data || dashboardData?.managers || managerData;
  
  const filtered = regionFilter === 'all'
    ? sourceData
    : sourceData.filter(item => item.region === regionFilter);

  let html = '';
  filtered.forEach(item => {
    html += `
      <tr>
        <td>${item.manager}</td>
        <td>${item.region}</td>
        <td>${item.sales}</td>
        <td>${item.revenue.toLocaleString('ru-RU')}</td>
      </tr>
    `;
  });

  if (filtered.length === 0) {
    html = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--color-text-muted);">Нет данных для выбранного региона</td></tr>`;
  }

  tbody.innerHTML = html;
}

// Изменяем инициализацию графика
function initChart(chartData) {
  const ctx = document.getElementById('salesChart').getContext('2d');
  const canvasParent = ctx.canvas.parentElement;
  canvasParent.style.height = '300px';
  canvasParent.style.width = '100%';

  const data = chartData || { months: months, sales: salesData };

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: [{
        label: 'Выручка (тыс. ₽)',
        data: data.sales,
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
// ФИЛЬТР ПО РЕГИОНАМ (обновлённый)
// =============================================================
document.addEventListener('DOMContentLoaded', async function() {
  // Загружаем дату
  const dateEl = document.getElementById('currentDate');
  const now = new Date();
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('ru-RU', options);

  // Инициализируем дашборд с загрузкой данных
  await initDashboard();

  // Навешиваем обработчик на фильтр
  const filterSelect = document.getElementById('regionFilter');
  filterSelect.addEventListener('change', (e) => {
    const selectedRegion = e.target.value;
    // Используем данные из загруженного JSON или локальные
    const sourceData = dashboardData?.managers || managerData;
    renderTable(sourceData, selectedRegion);
  });
});
