import React, { useState } from 'react';

function polarToCartesian(distance, azimuth) {
  const angleRad = (90 - azimuth) * Math.PI / 180;
  const x = distance * Math.cos(angleRad);
  const y = distance * Math.sin(angleRad);
  return { x, y };
}



const ARTILLERY_DEVIATION_PER_LEVEL = {
  '120': 10,
  '150': 10,
  'rocket': 10,
  '300': 50
};

function calculateWindEffect(shellAzimuth, windDirection, windLevel, artilleryType) {
  if (windLevel === '0') return { range: 0, deflection: 0 };

  const baseDeviation = ARTILLERY_DEVIATION_PER_LEVEL[artilleryType];
  const totalDeviation = baseDeviation * Number(windLevel);

  let relativeAngle = ((windDirection - shellAzimuth + 180 + 360) % 360) * Math.PI / 180;

  return {
    range: totalDeviation * Math.cos(relativeAngle),
    deflection: totalDeviation * Math.sin(relativeAngle)
  };
}


// Простые компоненты-обертки вместо shadcn/ui
const Card = ({ children }) => (
  <div className="bg-[#2E2420] rounded-lg shadow-xl border border-[#4A3C2E]">
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-4 border-b border-[#4A3C2E]">{children}</div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-xl font-bold text-[#8B7355]">{children}</h2>
);

const CardContent = ({ children }) => (
  <div className="p-4">{children}</div>
);

const WindIndicator = ({ windDirection, shellAzimuth }) => {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-40 h-40">
        {/* Основной круг компаса */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="gray" strokeWidth="1" />

        {/* Основные направления */}
        <text x="100" y="15" textAnchor="middle" className="font-bold">N</text>
        <text x="185" y="100" textAnchor="middle" className="font-bold">E</text>
        <text x="100" y="190" textAnchor="middle" className="font-bold">S</text>
        <text x="15" y="100" textAnchor="middle" className="font-bold">W</text>

        {/* Дополнительные направления */}
        <text x="157" y="43" textAnchor="middle" className="font-bold">NE</text>
        <text x="43" y="43" textAnchor="middle" className="font-bold">NW</text>
        <text x="157" y="157" textAnchor="middle" className="font-bold">SE</text>
        <text x="43" y="157" textAnchor="middle" className="font-bold">SW</text>

        {/* Направление стрельбы */}
        <g transform={`rotate(${shellAzimuth} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="30"
            stroke="red" strokeWidth="2" markerEnd="url(#arrowhead)" />
        </g>

        {/* Направление ветра */}
        <g transform={`rotate(${windDirection} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="40"
            stroke="blue" strokeWidth="2" strokeDasharray="4"
            markerEnd="url(#arrowhead)" />
        </g>

        {/* Маркеры для стрелок */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>
      </svg>

      {/* Легенда */}
      <div className="flex gap-4 text-sm mt-2">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-500 mr-1"></div>
          <span>Направление стрельбы</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-500 mr-1 border-dashed border-t"></div>
          <span>Направление ветра</span>
        </div>
      </div>
    </div>
  );
};


const BattlefieldMap = ({
  artilleryDistance,
  artilleryAzimuth,
  targetDistance,
  targetAzimuth,
  result
}) => {
  // Предыдущий код расчета координат остается тем же
  const artillery = polarToCartesian(Number(artilleryDistance), Number(artilleryAzimuth));
  const target = polarToCartesian(Number(targetDistance), Number(targetAzimuth));
  const maxDistance = Math.max(
    artilleryDistance,
    targetDistance,
    Math.sqrt(target.x * target.x + target.y * target.y)
  );
  const scale = 80 / maxDistance;
  const scaledArtillery = {
    x: artillery.x * scale + 100,
    y: -artillery.y * scale + 100
  };
  const scaledTarget = {
    x: target.x * scale + 100,
    y: -target.y * scale + 100
  };
  const spotterPos = { x: 100, y: 100 };

  // Функция для расчета угла между двумя точками (для размещения текста)
  const getAngle = (x1, y1, x2, y2) => {
    return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  };

  // Расчет позиций для подписей расстояний (по середине линий)
  const getMidPoint = (x1, y1, x2, y2, offset = 0) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    let angle = getAngle(x1, y1, x2, y2);

    // Корректируем угол для читаемости текста
    if (angle > 90 || angle < -90) {
      angle = angle + 180;
    }

    return {
      x: midX + offset * Math.cos((angle + 90) * Math.PI / 180),
      y: midY + offset * Math.sin((angle + 90) * Math.PI / 180),
      angle: angle
    };
  };

  return (
    <div className="mt-4">
      <svg viewBox="0 0 200 220" className="w-full h-full max-w-md mx-auto"> {/* Увеличили высоту для легенды */}
        {/* Основа карты */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="#4A3C2E" strokeWidth="1" />
        <circle cx="100" cy="100" r="45" fill="none" stroke="#4A3C2E" strokeWidth="0.5" strokeDasharray="2" />

        {/* Линии между точками */}
        <line
          x1={spotterPos.x}
          y1={spotterPos.y}
          x2={scaledArtillery.x}
          y2={scaledArtillery.y}
          stroke="#6B4423"
          strokeWidth="1"
        />
        <line
          x1={spotterPos.x}
          y1={spotterPos.y}
          x2={scaledTarget.x}
          y2={scaledTarget.y}
          stroke="#8B7355"
          strokeWidth="1"
        />
        <line
          x1={scaledArtillery.x}
          y1={scaledArtillery.y}
          x2={scaledTarget.x}
          y2={scaledTarget.y}
          stroke="#FF4444"
          strokeWidth="1"
          strokeDasharray="4"
        />

        {/* Точки позиций */}
        <circle cx={spotterPos.x} cy={spotterPos.y} r="3" fill="#8B7355" />
        <circle cx={scaledArtillery.x} cy={scaledArtillery.y} r="3" fill="#6B4423" />
        <circle cx={scaledTarget.x} cy={scaledTarget.y} r="3" fill="#FF4444" />

        {/* Расстояния и азимуты вдоль линий */}
        {[
          {
            p1: spotterPos,
            p2: scaledArtillery,
            text: `${artilleryDistance}м / ${artilleryAzimuth}°`,
            color: "#6B4423"
          },
          {
            p1: spotterPos,
            p2: scaledTarget,
            text: `${targetDistance}м / ${targetAzimuth}°`,
            color: "#8B7355"
          },
          {
            p1: scaledArtillery,
            p2: scaledTarget,
            text: result ? `${result.baseDistance}м / ${result.baseAzimuth}°` : "",
            color: "#FF4444"
          }
        ].map((line, index) => {
          const mid = getMidPoint(line.p1.x, line.p1.y, line.p2.x, line.p2.y, 8);
          return (
            <text
              key={index}
              x={mid.x}
              y={mid.y}
              fill={line.color}
              fontSize="6"
              textAnchor="middle"
              transform={`rotate(${mid.angle}, ${mid.x}, ${mid.y})`}
            >
              {line.text}
            </text>
          );
        })}

        {/* Легенда */}
        <g transform="translate(40, 200)">
          <g className="flex items-center">
            <circle cx="0" cy="0" r="3" fill="#6B4423" />
            <text x="8" y="3" fill="#6B4423" fontSize="8">Артиллерия</text>
          </g>
          <g transform="translate(60, 0)">
            <circle cx="0" cy="0" r="3" fill="#8B7355" />
            <text x="8" y="3" fill="#8B7355" fontSize="8">Наводчик</text>
          </g>
          <g transform="translate(120, 0)">
            <circle cx="0" cy="0" r="3" fill="#FF4444" />
            <text x="8" y="3" fill="#FF4444" fontSize="8">Цель</text>
          </g>
        </g>
      </svg>
    </div>
  );
};

const TriangulationMap = ({
  targetDistance,
  targetAzimuth,
  impactDistance,
  impactAzimuth,
  result
}) => {
  // Преобразуем координаты в декартовы
  const target = polarToCartesian(Number(targetDistance), Number(targetAzimuth));
  const impact = polarToCartesian(Number(impactDistance), Number(impactAzimuth));

  // Находим максимальное расстояние для масштабирования
  const maxDistance = Math.max(
    targetDistance,
    impactDistance
  );

  const scale = 80 / maxDistance;

  // Масштабируем координаты
  const scaledTarget = {
    x: target.x * scale + 100,
    y: -target.y * scale + 100
  };

  const scaledImpact = {
    x: impact.x * scale + 100,
    y: -impact.y * scale + 100
  };

  const spotterPos = { x: 100, y: 100 };

  // Функция для корректного угла текста
  const getMidPoint = (x1, y1, x2, y2, offset = 0) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    if (angle > 90 || angle < -90) {
      angle = angle + 180;
    }

    return {
      x: midX + offset * Math.cos((angle + 90) * Math.PI / 180),
      y: midY + offset * Math.sin((angle + 90) * Math.PI / 180),
      angle: angle
    };
  };

  return (
    <svg viewBox="0 0 200 220" className="w-full h-full max-w-md mx-auto">
      {/* Основа карты */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="#4A3C2E" strokeWidth="1" />
      <circle cx="100" cy="100" r="45" fill="none" stroke="#4A3C2E" strokeWidth="0.5" strokeDasharray="2" />

      {/* Линии от наводчика */}
      <line
        x1={spotterPos.x}
        y1={spotterPos.y}
        x2={scaledTarget.x}
        y2={scaledTarget.y}
        stroke="#FF4444"
        strokeWidth="1"
      />
      <line
        x1={spotterPos.x}
        y1={spotterPos.y}
        x2={scaledImpact.x}
        y2={scaledImpact.y}
        stroke="#8B7355"
        strokeWidth="1"
      />

      {/* Точки позиций */}
      <circle cx={spotterPos.x} cy={spotterPos.y} r="3" fill="#8B7355" />
      <circle cx={scaledTarget.x} cy={scaledTarget.y} r="3" fill="#FF4444" />
      <circle cx={scaledImpact.x} cy={scaledImpact.y} r="3" fill="#6B4423" />

      {/* Расстояния и азимуты */}
      {[
        {
          p1: spotterPos,
          p2: scaledTarget,
          text: `${targetDistance}м / ${targetAzimuth}°`,
          color: "#FF4444"
        },
        {
          p1: spotterPos,
          p2: scaledImpact,
          text: `${impactDistance}м / ${impactAzimuth}°`,
          color: "#8B7355"
        }
      ].map((line, index) => {
        const mid = getMidPoint(line.p1.x, line.p1.y, line.p2.x, line.p2.y, 8);
        return (
          <text
            key={index}
            x={mid.x}
            y={mid.y}
            fill={line.color}
            fontSize="6"
            textAnchor="middle"
            transform={`rotate(${mid.angle}, ${mid.x}, ${mid.y})`}
          >
            {line.text}
          </text>
        );
      })}

      {/* Легенда */}
      <g transform="translate(40, 200)">
        <g className="flex items-center">
          <circle cx="0" cy="0" r="3" fill="#8B7355" />
          <text x="8" y="3" fill="#8B7355" fontSize="8">Наводчик</text>
        </g>
        <g transform="translate(60, 0)">
          <circle cx="0" cy="0" r="3" fill="#FF4444" />
          <text x="8" y="3" fill="#FF4444" fontSize="8">Цель</text>
        </g>
        <g transform="translate(120, 0)">
          <circle cx="0" cy="0" r="3" fill="#6B4423" />
          <text x="8" y="3" fill="#6B4423" fontSize="8">Падение</text>
        </g>
      </g>
    </svg>
  );
};

// Новый компонент для подсказок по уровням ветра
const WindLevelGuide = () => (
  <div className="space-y-6"> {/* Добавляем контейнер для отступа между блоками */}
    {/* Существующие 4 картинки */}
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex flex-col items-center">
        <img
          src="/WindSockAnim1.gif"
          alt="Уровень ветра 1"
          className="w-32 h-24 object-cover rounded border border-gray-200"
        />
        <span className="mt-2 text-sm font-medium">Уровень 1</span>
      </div>
      <div className="flex flex-col items-center">
        <img
          src="/WindSockAnim2.gif"
          alt="Уровень ветра 2"
          className="w-32 h-24 object-cover rounded border border-gray-200"
        />
        <span className="mt-2 text-sm font-medium">Уровень 2</span>
      </div>
      <div className="flex flex-col items-center">
        <img
          src="/WindSockAnim3.gif"
          alt="Уровень ветра 3"
          className="w-32 h-24 object-cover rounded border border-gray-200"
        />
        <span className="mt-2 text-sm font-medium">Уровень 3</span>
      </div>
      <div className="flex flex-col items-center">
        <img
          src="/WindSockAnim4.gif"
          alt="Уровень ветра 4"
          className="w-32 h-24 object-cover rounded border border-gray-200"
        />
        <span className="mt-2 text-sm font-medium">Уровень 4-5</span>
      </div>
    </div>

    {/* Добавляем GIF снизу */}
    <div className="flex justify-center">
      <img
        src="/Flag_Wind_Strengths.gif"
        alt="Анимация ветра"
        className="w-[320px] h-[180px] rounded border border-gray-200"
      />
    </div>
  </div>
);

// Добавить после WindLevelGuide и перед ArtilleryCalculator
const TriangulationCalculator = () => {
  const [targetDistance, setTargetDistance] = useState('');
  const [targetAzimuth, setTargetAzimuth] = useState('');
  const [impactDistance, setImpactDistance] = useState('');
  const [impactAzimuth, setImpactAzimuth] = useState('');
  const [artilleryType, setArtilleryType] = useState('120');
  const [windLevel, setWindLevel] = useState('0');
  const [windDirection, setWindDirection] = useState('0');
  const [result, setResult] = useState(null);

  function calculateArtilleryPosition() {
    if (!targetDistance || !targetAzimuth || !impactDistance || !impactAzimuth) {
      return;
    }

    // Прямой расчет поправок по дистанции и азимуту
    const correctionDistance = Number(targetDistance) - Number(impactDistance);
    let correctionAzimuth = Number(targetAzimuth) - Number(impactAzimuth);

    // Нормализация азимута в пределах ±180°
    if (correctionAzimuth > 180) correctionAzimuth -= 360;
    if (correctionAzimuth < -180) correctionAzimuth += 360;

    // Учитываем поправку на ветер
    const windEffect = calculateWindEffect(
      Number(impactAzimuth), // Используем азимут падения как базовый
      Number(windDirection),
      windLevel,
      artilleryType
    );

    // Расчет влияния ветра на коррекцию
    const finalCorrection = {
      // Если корректировка положительная - увеличить дистанцию
      // Если отрицательная - уменьшить дистанцию
      distance: Math.round((correctionDistance + windEffect.range) * 10) / 10,

      // Учитываем влияние ветра на азимут
      azimuth: Math.round((correctionAzimuth +
        Math.atan2(windEffect.deflection, Number(impactDistance)) * 180 / Math.PI) * 10) / 10
    };

    setResult({
      // Базовая поправка без учета ветра
      correctionDistance: Math.round(correctionDistance * 10) / 10,
      correctionAzimuth: Math.round(correctionAzimuth * 10) / 10,

      // Эффект ветра
      windEffect: {
        range: Math.round(windEffect.range * 10) / 10,
        deflection: Math.round(windEffect.deflection * 10) / 10
      },

      // Финальная поправка с учетом ветра
      finalCorrection
    });
  }

  return (
    <div className="space-y-4 text-[#8B7355]">
      <div className="p-4 bg-[#4A3C2E] rounded-lg border border-[#6B4423]">
        <p className="text-sm">
          1. Укажите дистанцию и азимут до цели<br />
          2. Укажите дистанцию и азимут до точки падения снаряда<br />
          3. Калькулятор определит позицию артиллерии и рассчитает параметры стрельбы
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Дистанция до цели (м)</label>
          <input
            type="number"
            value={targetDistance}
            onChange={(e) => setTargetDistance(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Азимут на цель (°)</label>
          <input
            type="number"
            value={targetAzimuth}
            onChange={(e) => setTargetAzimuth(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Дистанция до точки падения (м)</label>
          <input
            type="number"
            value={impactDistance}
            onChange={(e) => setImpactDistance(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Азимут на точку падения (°)</label>
          <input
            type="number"
            value={impactAzimuth}
            onChange={(e) => setImpactAzimuth(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Тип артиллерии</label>
          <select
            value={artilleryType}
            onChange={(e) => setArtilleryType(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          >
            <option value="120">120mm</option>
            <option value="150">150mm</option>
            <option value="rocket">Rocket Artillery</option>
            <option value="300">300mm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Сила ветра</label>
          <select
            value={windLevel}
            onChange={(e) => setWindLevel(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          >
            <option value="0">Нет ветра</option>
            <option value="1">Уровень 1</option>
            <option value="2">Уровень 2</option>
            <option value="3">Уровень 3</option>
            <option value="4">Уровень 4</option>
            <option value="5">Уровень 5</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Направление ветра (°)</label>
          <input
            type="number"
            value={windDirection}
            onChange={(e) => setWindDirection(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
      </div>

      <button
        onClick={calculateArtilleryPosition}
        className="w-full p-2 bg-[#4A3C2E] text-[#8B7355] rounded-lg hover:bg-[#6B4423]"
      >
        Рассчитать позицию
      </button>

      {result && (
        <div className="mt-4 p-4 bg-[#2E2420] rounded-lg border border-[#4A3C2E]">
          <h3 className="font-medium">Результаты расчета:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Базовая поправка:</p>
              <p>Дистанция: {result.correctionDistance > 0 ? "+" : ""}{result.correctionDistance} м</p>
              <p>Азимут: {result.correctionAzimuth > 0 ? "+" : ""}{result.correctionAzimuth}°</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Влияние ветра:</p>
              <p>По дистанции: {result.windEffect.range > 0 ? "+" : ""}{result.windEffect.range} м</p>
              <p>Боковой снос: {result.windEffect.deflection > 0 ? "+" : ""}{result.windEffect.deflection} м</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Итоговая поправка:</p>
              <p className="font-medium">Изменить дистанцию на: {result.finalCorrection.distance > 0 ? "+" : ""}{result.finalCorrection.distance} м</p>
              <p className="font-medium">Изменить азимут на: {result.finalCorrection.azimuth > 0 ? "+" : ""}{result.finalCorrection.azimuth}°</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-yellow-500">
              ⚠️ Поправки указывают, на сколько нужно изменить текущие настройки артиллерии
            </p>
          </div>
          <TriangulationMap
            targetDistance={targetDistance}
            targetAzimuth={targetAzimuth}
            impactDistance={impactDistance}
            impactAzimuth={impactAzimuth}
            result={result}
          />
        </div>
      )}
    </div>
  );
};

// Добавить после TriangulationCalculator и перед ArtilleryCalculator
const ArtilleryGroupCalculator = () => {
  const [centralDistance, setCentralDistance] = useState('100');
  const [centralAzimuth, setCentralAzimuth] = useState('0');
  const [artillery, setArtillery] = useState([]);
  const GRID_SIZE_X = 50;
  const GRID_SIZE_Y = 20;
  const CELL_SIZE = 1;
  const [draggingArt, setDraggingArt] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickPosition, setLastClickPosition] = useState(null);

  // Функция для добавления артиллерии по клику на сетку
  const handleGridClick = (e) => {
    const svg = e.currentTarget;

    // Создаем точку в координатах клиента (экрана)
    const pt = new DOMPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Получаем матрицу преобразования из координат экрана в координаты SVG
    const svgMatrix = svg.getScreenCTM().inverse();

    // Преобразуем координаты клика в координаты SVG
    const svgPoint = pt.matrixTransform(svgMatrix);

    // Округляем до целых координат
    const roundedX = Math.round(svgPoint.x);
    const roundedY = Math.round(svgPoint.y);

    // Проверяем границы
    if (roundedX < 0 || roundedX > GRID_SIZE_X || roundedY < 0 || roundedY > GRID_SIZE_Y) {
      return;
    }

    const currentTime = new Date().getTime();

    if (lastClickPosition &&
      lastClickPosition.x === roundedX &&
      lastClickPosition.y === roundedY &&
      currentTime - lastClickTime < 300) {

      const existingArtIndex = artillery.findIndex(
        art => Math.abs(art.x - roundedX) < 1 && Math.abs(art.y - roundedY) < 1
      );

      if (existingArtIndex !== -1) {
        if (artillery[existingArtIndex].isCentral) return;
        setArtillery(artillery.filter((_, index) => index !== existingArtIndex));
      } else {
        const newArtillery = {
          id: Date.now(),
          x: roundedX,
          y: roundedY,
          isCentral: artillery.length === 0,
          correction: { distance: 0, azimuth: 0 }
        };
        setArtillery([...artillery, newArtillery]);
      }

      setLastClickTime(0);
      setLastClickPosition(null);
    } else {
      setLastClickTime(currentTime);
      setLastClickPosition({ x: roundedX, y: roundedY });
    }
  };

  const handleDragStart = (e, art) => {
    e.stopPropagation();
    setDraggingArt(art);
    setIsDragging(true);
  };

  const handleDrag = (e) => {
    if (!isDragging || !draggingArt) return;
  
    const svg = e.currentTarget;
    const pt = new DOMPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const svgMatrix = svg.getScreenCTM().inverse();
    const svgPoint = pt.matrixTransform(svgMatrix);
    
    const roundedX = Math.round(svgPoint.x);
    const roundedY = Math.round(svgPoint.y);
  
    if (roundedX >= 0 && roundedX <= GRID_SIZE_X && roundedY >= 0 && roundedY <= GRID_SIZE_Y) {
      setArtillery(artillery.map(art =>
        art.id === draggingArt.id
          ? { ...art, x: roundedX, y: roundedY }
          : art
      ));
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggingArt(null);
  };

  const getArtilleryNumber = (artillery, currentIndex) => {
    // Если это центральная артиллерия, всегда возвращаем 1
    if (artillery[currentIndex].isCentral) return 1;

    // Подсчитываем, какой это по счету элемент (не центральный)
    let nonCentralCount = 0;
    for (let i = 0; i < currentIndex; i++) {
      if (!artillery[i].isCentral) {
        nonCentralCount++;
      }
    }

    // Возвращаем номер: количество не центральных элементов до текущего + 2
    // (+2 потому что центральная арта занимает номер 1)
    return nonCentralCount + 2;
  };

  const calculateDistance = (art1, art2) => {
    const dx = (art1.x - art2.x) * CELL_SIZE;
    const dy = (art1.y - art2.y) * CELL_SIZE;
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  };

  // Расчет поправок для каждой артиллерии
  const calculateCorrections = () => {
    const centralArt = artillery.find(art => art.isCentral);
    if (!centralArt) return;

    const updatedArtillery = artillery.map(art => {
      if (art.isCentral) return { ...art, correction: { distance: 0, azimuth: 0 } };

      // Расчет разницы позиций относительно центральной арты
      const dx = art.x - centralArt.x;
      const dy = art.y - centralArt.y;

      // Расчет поправок
      const baseDistance = Number(centralDistance);
      const baseAzimuth = Number(centralAzimuth);

      // Расчет угла между артой и целью
      const angleToTarget = Math.atan2(baseDistance, dx) * 180 / Math.PI;

      // Расчет новой дистанции (учитывая смещение)
      const newDistance = Math.sqrt(baseDistance * baseDistance + dx * dx + dy * dy);

      // Расчет азимутальной поправки
      let azimuthCorrection = angleToTarget - baseAzimuth;
      if (azimuthCorrection > 180) azimuthCorrection -= 360;
      if (azimuthCorrection < -180) azimuthCorrection += 360;

      return {
        ...art,
        correction: {
          distance: Math.round((newDistance - baseDistance) * 10) / 10,
          azimuth: Math.round(azimuthCorrection * 10) / 10
        }
      };
    });

    setArtillery(updatedArtillery);
  };

  return (
    <div className="space-y-4 text-[#8B7355]">
      {/* Добавляем подсказку первым элементом */}
      <div className="p-4 bg-[#4A3C2E] rounded-lg border border-[#6B4423] mb-4">
        <p className="text-sm">
          1. Дважды кликните по пустой клетке, чтобы разместить артиллерию<br />
          2. Дважды кликните по существующей артиллерии, чтобы убрать её<br />
          3. Центральную артиллерию (красную) можно только перемещать<br />
          4. Перетащите артиллерию, чтобы изменить её позицию
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Дистанция центральной арты (м)</label>
          <input
            type="number"
            value={centralDistance}
            onChange={(e) => setCentralDistance(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Азимут центральной арты (°)</label>
          <input
            type="number"
            value={centralAzimuth}
            onChange={(e) => setCentralAzimuth(e.target.value)}
            className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded"
          />
        </div>
      </div>

      {/* Затем идет сетка */}
      <div className="relative w-full h-[300px] bg-[#2E2420] border border-[#4A3C2E] rounded overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${GRID_SIZE_X} ${GRID_SIZE_Y}`}
          className="w-full h-full cursor-crosshair"
          onClick={handleGridClick}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {/* Фон */}
          <rect
            x="0"
            y="0"
            width={GRID_SIZE_X}
            height={GRID_SIZE_Y}
            fill="#2E2420"
          />

          {/* Основные линии сетки (каждые 5 метров) */}
          {[...Array(Math.floor(GRID_SIZE_X / 5) + 1)].map((_, i) => (
            <g key={`v-major-${i}`}>
              <line
                x1={i * 5}
                y1="0"
                x2={i * 5}
                y2={GRID_SIZE_Y}
                stroke="#4A3C2E"
                strokeWidth="0.15"
              />
              {/* Метки расстояния по X */}
              <text
                x={i * 5}
                y={GRID_SIZE_Y - 0.3}
                fontSize="0.8"
                fill="#8B7355"
                textAnchor="middle"
              >
                {i * 5}
              </text>
            </g>
          ))}
          {[...Array(Math.floor(GRID_SIZE_Y / 5) + 1)].map((_, i) => (
            <g key={`h-major-${i}`}>
              <line
                x1="0"
                y1={i * 5}
                x2={GRID_SIZE_X}
                y2={i * 5}
                stroke="#4A3C2E"
                strokeWidth="0.15"
              />
              {/* Метки расстояния по Y */}
              <text
                x="0.5"
                y={i * 5 + 0.3}
                fontSize="0.8"
                fill="#8B7355"
              >
                {i * 5}
              </text>
            </g>
          ))}

          {/* Вспомогательные линии сетки (каждый метр) */}
          {[...Array(GRID_SIZE_X + 1)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i}
              y1="0"
              x2={i}
              y2={GRID_SIZE_Y}
              stroke="#4A3C2E"
              strokeWidth="0.05"
              strokeOpacity="0.3"
            />
          ))}
          {[...Array(GRID_SIZE_Y + 1)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i}
              x2={GRID_SIZE_X}
              y2={i}
              stroke="#4A3C2E"
              strokeWidth="0.05"
              strokeOpacity="0.3"
            />
          ))}

          {/* Линии между артиллерией */}
          {artillery.map((art1, i) =>
            artillery.slice(i + 1).map(art2 => {
              const distance = calculateDistance(art1, art2);
              const midX = (art1.x + art2.x) / 2;
              const midY = (art1.y + art2.y) / 2;
              const angle = Math.atan2(art2.y - art1.y, art2.x - art1.x);

              // Смещение для текста
              const labelOffset = 0.7;
              const textX = midX + Math.sin(angle) * labelOffset;
              const textY = midY - Math.cos(angle) * labelOffset;

              return (
                <g key={`${art1.id}-${art2.id}`}>
                  <line
                    x1={art1.x}
                    y1={art1.y}
                    x2={art2.x}
                    y2={art2.y}
                    stroke="#4A3C2E"
                    strokeWidth="0.1"
                    strokeDasharray="0.3"
                  />
                  {/* Фон для текста */}
                  <rect
                    x={textX - 2}
                    y={textY - 0.7}
                    width="4"
                    height="1.4"
                    fill="#2E2420"
                    fillOpacity="0.9"
                    rx="0.2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fontSize="1.2"
                    fill="#8B7355"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {distance}м
                  </text>
                </g>
              );
            })
          )}

          {/* Артиллерийские позиции */}
          {artillery.map((art, index) => {
            const artNumber = getArtilleryNumber(artillery, index);
            return (
              <g
                key={art.id}
                transform={`translate(${art.x} ${art.y})`}
                onMouseDown={(e) => handleDragStart(e, art)}
                style={{ cursor: 'move' }}
              >
                {/* Подсветка точки */}
                <circle
                  r="1"
                  fill="#2E2420"
                  stroke="#4A3C2E"
                  strokeWidth="0.2"
                />
                {/* Сама точка */}
                <circle
                  r="0.7"
                  fill={art.isCentral ? "#FF4444" : "#6B4423"}
                  stroke="#4A3C2E"
                  strokeWidth="0.15"
                />
                {/* Номер артиллерии */}
                <text
                  x="0"
                  y="0.4"  // Изменено с -1.5 на 0.4 для центрирования внутри круга
                  fontSize="1"  // Уменьшил размер для лучшего размещения
                  fill="#FFFFFF"  // Изменил цвет на белый для лучшей видимости
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {artNumber}
                </text>

                {/* Информация о поправках */}
                {!art.isCentral && art.correction && (
                  <g>
                    <rect
                      x="1"
                      y="-1.8"
                      width="7"
                      height="3.6"
                      fill="#2E2420"
                      fillOpacity="0.9"
                      rx="0.3"
                    />
                    <text
                      x="1.2"
                      y="-0.6"
                      fontSize="1.1"
                      fill="#8B7355"
                    >
                      {art.correction.distance > 0 ? "+" : ""}{art.correction.distance}м
                    </text>
                    <text
                      x="1.2"
                      y="0.9"
                      fontSize="1.1"
                      fill="#8B7355"
                    >
                      {art.correction.azimuth > 0 ? "+" : ""}{art.correction.azimuth}°
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Подсказка по масштабу */}
        <div className="absolute bottom-1 left-1 text-xs text-[#8B7355] bg-[#2E2420] px-2 py-1 rounded opacity-80">
          1 клетка = 1 метр
        </div>
      </div>


      <button
        onClick={calculateCorrections}
        className="w-full p-2 bg-[#4A3C2E] text-[#8B7355] rounded-lg hover:bg-[#6B4423]"
      >
        Рассчитать поправки
      </button>

      {/* Список артиллерии и их поправок */}
      {artillery.length > 0 && (
        <div className="mt-4 p-4 bg-[#2E2420] rounded-lg border border-[#4A3C2E]">
          <h3 className="font-medium mb-2">Поправки для артиллерии:</h3>
          <div className="space-y-2">
            {artillery.map((art, index) => {
              const artNumber = getArtilleryNumber(artillery, index);
              return (
                <div key={art.id} className="flex justify-between items-center">
                  <span>
                    Арта #{artNumber} {art.isCentral && "(Центральная)"}:
                  </span>
                  <span>
                    {art.isCentral ? "Без поправок" :
                      `Дист: ${art.correction.distance > 0 ? "+" : ""}${art.correction.distance}м, 
                 Азимут: ${art.correction.azimuth > 0 ? "+" : ""}${art.correction.azimuth}°`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ContactBlock = () => (
  <div className="mt-8 flex flex-col items-center justify-center">
    <div className="bg-[#0A0A0A] rounded-lg p-2"> {/* черный фон для изображения */}
      <img
        src="/buckshot_Dealer_2.png"
        alt="Contact Author"
        className="w-[146px] h-[175px] object-contain"
      />
    </div>
    <a
      href="https://steamcommunity.com/profiles/76561198208667549/"
      className="mt-4 px-6 py-2 bg-[#4A3C2E] text-[#8B7355] rounded-lg 
                   hover:bg-[#6B4423] transition-colors font-medium"
    >
      Связаться с автором
    </a>
  </div>
);

const ArtilleryCalculator = () => {
  const [calculatorMode, setCalculatorMode] = useState('direct');
  const [artilleryDistance, setArtilleryDistance] = useState('100');
  const [artilleryAzimuth, setArtilleryAzimuth] = useState('180');
  const [targetDistance, setTargetDistance] = useState('80');
  const [targetAzimuth, setTargetAzimuth] = useState('90');
  const [windLevel, setWindLevel] = useState('0');
  const [windDirection, setWindDirection] = useState('0');
  const [artilleryType, setArtilleryType] = useState('120');
  const [result, setResult] = useState(null);

  const ARTILLERY_DEVIATION_PER_LEVEL = {
    '120': 10,
    '150': 10,
    'rocket': 10,
    '300': 50
  };

  function polarToCartesian(distance, azimuth) {
    const angleRad = (90 - azimuth) * Math.PI / 180;
    const x = distance * Math.cos(angleRad);
    const y = distance * Math.sin(angleRad);
    return { x, y };
  }

  function cartesianToPolar(x, y) {
    const distance = Math.sqrt(x * x + y * y);
    let azimuth = 90 - (Math.atan2(y, x) * 180 / Math.PI);
    if (azimuth < 0) azimuth += 360;
    return { distance, azimuth };
  }

  function calculateWindEffect(shellAzimuth, windDirection, windLevel) {
    if (windLevel === '0') return { range: 0, deflection: 0 };

    const baseDeviation = ARTILLERY_DEVIATION_PER_LEVEL[artilleryType];
    const totalDeviation = baseDeviation * Number(windLevel);

    // Важно: ветер дует В этом направлении, значит нам надо целиться 
    // в ПРОТИВОПОЛОЖНУЮ сторону для компенсации
    let relativeAngle = ((windDirection - shellAzimuth + 180 + 360) % 360) * Math.PI / 180;

    return {
      range: totalDeviation * Math.cos(relativeAngle),
      deflection: totalDeviation * Math.sin(relativeAngle)
    };
  }

  function calculateFiringData() {
    const artillery = polarToCartesian(Number(artilleryDistance), Number(artilleryAzimuth));
    const target = polarToCartesian(Number(targetDistance), Number(targetAzimuth));

    const vectorToTarget = {
      x: target.x - artillery.x,
      y: target.y - artillery.y
    };

    const baseParams = cartesianToPolar(vectorToTarget.x, vectorToTarget.y);

    const windEffect = calculateWindEffect(baseParams.azimuth, Number(windDirection), windLevel);

    const adjustedDistance = baseParams.distance + windEffect.range;

    const adjustedAzimuth = baseParams.azimuth +
      Math.atan2(windEffect.deflection, baseParams.distance) * 180 / Math.PI;

    setResult({
      baseDistance: Math.round(baseParams.distance * 10) / 10,
      baseAzimuth: Math.round(baseParams.azimuth * 10) / 10,
      windRangeEffect: Math.round(windEffect.range * 10) / 10,
      windDeflectionEffect: Math.round(windEffect.deflection * 10) / 10,
      adjustedDistance: Math.round(adjustedDistance * 10) / 10,
      adjustedAzimuth: Math.round(adjustedAzimuth * 10) / 10
    });

  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Калькулятор наводчика артиллерии</CardTitle>
        {/* Добавить переключатель режимов */}
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setCalculatorMode('direct')}
            className={`px-4 py-2 rounded ${calculatorMode === 'direct'
              ? 'bg-[#4A3C2E] text-[#8B7355]'
              : 'bg-[#2E2420] text-[#4A3C2E]'
              }`}
          >
            Прямой расчет
          </button>
          <button
            onClick={() => setCalculatorMode('triangulation')}
            className={`px-4 py-2 rounded ${calculatorMode === 'triangulation'
              ? 'bg-[#4A3C2E] text-[#8B7355]'
              : 'bg-[#2E2420] text-[#4A3C2E]'
              }`}
          >
            Триангуляция
          </button>

          <button
            onClick={() => setCalculatorMode('group')}
            className={`px-4 py-2 rounded ${calculatorMode === 'group'
              ? 'bg-[#4A3C2E] text-[#8B7355]'
              : 'bg-[#2E2420] text-[#4A3C2E]'
              }`}
          >
            Групповая наводка
          </button>
        </div>

      </CardHeader>
      <CardContent>
        {calculatorMode === 'direct' ? (
          <div className="space-y-4 text-[#8B7355]">
            <div className="space-y-4 text-[#8B7355]">
              <div className="p-4 bg-[#4A3C2E] rounded-lg border border-[#6B4423]">
                <p className="text-sm">
                  1. Посмотрите на артиллерию через бинокль и запишите дистанцию и азимут<br />
                  2. Посмотрите на цель и запишите её дистанцию и азимут<br />
                  3. Укажите силу и направление ветра по Wind Sock<br />
                  4. Калькулятор выдаст параметры для установки на артиллерии
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Дистанция до артиллерии (м)</label>
                  <input
                    type="number"
                    value={artilleryDistance}
                    onChange={(e) => setArtilleryDistance(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] 
                       text-[#8B7355] placeholder-[#4A3C2E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Азимут на артиллерию (°)</label>
                  <input
                    type="number"
                    value={artilleryAzimuth}
                    onChange={(e) => setArtilleryAzimuth(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] 
                       text-[#8B7355] placeholder-[#4A3C2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Дистанция до цели (м)</label>
                  <input
                    type="number"
                    value={targetDistance}
                    onChange={(e) => setTargetDistance(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] 
                       text-[#8B7355] placeholder-[#4A3C2E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Азимут на цель (°)</label>
                  <input
                    type="number"
                    value={targetAzimuth}
                    onChange={(e) => setTargetAzimuth(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] 
                       text-[#8B7355] placeholder-[#4A3C2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium">Тип артиллерии</label>
                  <select
                    value={artilleryType}
                    onChange={(e) => setArtilleryType(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] text-[#8B7355]"
                  >
                    <option value="120">120mm</option>
                    <option value="150">150mm</option>
                    <option value="rocket">Rocket Artillery</option>
                    <option value="300">300mm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Сила ветра (уровень)</label>
                  <select
                    value={windLevel}
                    onChange={(e) => setWindLevel(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] text-[#8B7355]"
                  >
                    <option value="0">Нет ветра</option>
                    <option value="1">Уровень 1</option>
                    <option value="2">Уровень 2</option>
                    <option value="3">Уровень 3</option>
                    <option value="4">Уровень 4</option>
                    <option value="5">Уровень 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Направление ветра (°)</label>
                  <input
                    type="number"
                    value={windDirection}
                    onChange={(e) => setWindDirection(e.target.value)}
                    className="w-full p-2 bg-[#2E2420] border border-[#4A3C2E] rounded 
                       focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] 
                       text-[#8B7355] placeholder-[#4A3C2E]"
                  />
                </div>
              </div>

              <button
                onClick={calculateFiringData}
                className="w-full p-2 bg-[#4A3C2E] text-[#8B7355] rounded-lg 
                       hover:bg-[#6B4423] transition-colors font-medium"
              >
                Рассчитать
              </button>

              {result && (
                <div className="mt-4 p-4 bg-[#2E2420] rounded-lg border border-[#4A3C2E]">
                  <h3 className="font-medium">Установить на артиллерии:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Базовые параметры:</p>
                      <p>Дистанция: {result.baseDistance} м</p>
                      <p>Азимут: {result.baseAzimuth}°</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Поправки на ветер:</p>
                      <p>По дистанции: {result.windRangeEffect} м</p>
                      <p>Боковое смещение: {result.windDeflectionEffect} м</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Итоговые параметры:</p>
                      <p>Дистанция: {result.adjustedDistance} м</p>
                      <p>Азимут: {result.adjustedAzimuth}°</p>
                    </div>
                  </div>

                  <WindIndicator
                    windDirection={Number(windDirection)}
                    shellAzimuth={result.baseAzimuth}
                  />

                  <BattlefieldMap
                    artilleryDistance={artilleryDistance}
                    artilleryAzimuth={artilleryAzimuth}
                    targetDistance={targetDistance}
                    targetAzimuth={targetAzimuth}
                    result={result}
                  />

                </div>
              )}

              <div className="mt-4 p-4 bg-[#2E2420] rounded-lg border border-[#4A3C2E]">
                <h3 className="font-medium mb-2">Справка по отклонениям:</h3>
                <p className="text-sm">
                  Отклонение на каждый уровень ветра:<br />
                  • 120mm: 10 метров (максимум 50м)<br />
                  • 150mm: 10 метров (максимум 50м)<br />
                  • Rocket Artillery: 10 метров (максимум 50м)<br />
                  • 300mm: 50 метров (максимум 250м)<br />
                  <br />
                  Ветер влияет как на дистанцию стрельбы, так и на боковое отклонение снаряда.
                  Направление ветра: 0° = северный, 90° = восточный, 180° = южный, 270° = западный.
                </p>
              </div>

              <div className="mt-4 p-4 bg-[#2E2420] rounded-lg border border-[#4A3C2E]">
                <h3 className="font-medium mb-4">Визуальные подсказки по уровням ветра:</h3>
                <WindLevelGuide />
              </div>

              <ContactBlock />
            </div>
          </div>
        ) : calculatorMode === 'triangulation' ? (
          <TriangulationCalculator />
        ) : (
          <ArtilleryGroupCalculator />
        )}
      </CardContent>
    </Card>
  );
};

export default ArtilleryCalculator;