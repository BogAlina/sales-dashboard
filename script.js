/**
 * Даташборд продаж – скрипт
 * - Устанавливает текущую дату
 * - Рендерит таблицу с данными
 * - Инициализирует график Chart.js (столбчатый)
 * - Реализует фильтр по регионам (перерисовка таблицы)
 */

// =============================================================
// 1. ТЕКУЩАЯ ДАТА
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('currentDate');
  const now = new Date();
  const options = { day: '2-digit', month: 'long', year: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('ru-RU', options);
});

// =============================================================
// 2. ДАННЫЕ ДЛЯ ТАБЛИЦЫ
// =============================================================
const managerData = [
  { manager: 'Иванов А.', region: 'Москва', sales: 145, revenue: 435000 },
  { manager: 'Петров В.', region: 'СПб', sales: 98, revenue: 294000 },
  { manager: 'Сидоров К.', region: 'Казань', sales: 76, revenue: 228000 },
  { manager: 'Кузнецова М.', region: 'Москва', sales: 210, revenue: 630000 },
  { manager: 'Смирнов Д.', region: 'Новосибирск', sales: 54, revenue: 162000 },
  { manager: 'Васильева О.', region: 'Екатеринбург', sales: 67, revenue: 201000 },
  { manager: 'Николаев П.', region: 'СПб', sales: 112, revenue: 336000 },
  { manager: 'Михайлова А.', region: 'Казань', sales: 88, revenue: 264000 },
  { manager: 'Федоров С.', region: 'Москва', sales: 176, revenue: 528000 },
  { manager: 'Егорова Т.', region: 'Новосибирск', sales: 43, revenue: 129000 },
];

// =============================================================
// 3. ФУНКЦИЯ ОТРИСОВКИ ТАБЛИЦЫ (с фильтром)
// =============================================================
function renderTable(regionFilter = 'all') {
  const tbody = document.getElementById('tableBody');
  // Фильтруем данные
  const filtered = regionFilter === 'all'
    ? managerData
    : managerData.filter(item => item.region === regionFilter);

  // Формируем HTML-строки
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

  // Если ничего не найдено – показываем сообщение
  if (filtered.length === 0) {
    html = `<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--color-text-muted);">Нет данных для выбранного региона</td></tr>`;
  }

  tbody.innerHTML = html;
}

// =============================================================
// 4. ФИЛЬТР ПО РЕГИОНАМ (событие change)
// =============================================================
const filterSelect = document.getElementById('regionFilter');
filterSelect.addEventListener('change', (e) => {
  const selectedRegion = e.target.value;
  renderTable(selectedRegion);
});

// =============================================================
// 5. ИНИЦИАЛИЗАЦИЯ ГРАФИКА (Chart.js)
// =============================================================
const ctx = document.getElementById('salesChart').getContext('2d');

// Данные для графика (по месяцам)
const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const salesData = [320, 280, 390, 450, 410, 520, 580, 610, 560, 490, 530, 620];

new Chart(ctx, {
  type: 'bar',
  data: {
    labels: months,
    datasets: [{
      label: 'Выручка (тыс. ₽)',
      data: salesData,
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

// =============================================================
// 6. ПЕРВОНАЧАЛЬНЫЙ РЕНДЕР ТАБЛИЦЫ (все данные)
// =============================================================
renderTable('all');
