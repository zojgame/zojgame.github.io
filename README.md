# Circle Physics Simulation

Интерактивная 2D-симуляция столкновений кругов внутри прямоугольной области. Проект написан на TypeScript, использует React для интерфейса, Zustand для состояния и чистый WebGL2 для отрисовки.

## Возможности

- Физика кругов с массой, зависящей от радиуса.
- Упругие столкновения между кругами с учетом массы.
- Отражение от границ прямоугольного мира.
- Быстрая WebGL2-отрисовка через instanced rendering.
- SDF-круги со сглаженными краями.
- Панель управления: Play, Pause, Toggle, Reset.
- Форма добавления кругов с радиусом, позицией, скоростью и цветом.
- Сохранение настроек и списка кругов в `localStorage` через Zustand `persist`.

## Технологии

- TypeScript
- React
- Zustand
- Vite
- Raw WebGL2
- CSS без UI-библиотек

## Запуск

Установить зависимости:

```bash
npm install
```

Запустить dev-сервер:

```bash
npm run dev
```

Открыть приложение:

```text
http://127.0.0.1:5173
```

## Структура проекта

```text
src/
  components/
    AddCircleForm.tsx       Форма добавления круга
    CanvasContainer.tsx     Canvas и жизненный цикл Engine
    ControlPanel.tsx        Панель управления симуляцией
  store/
    useSimulationStore.ts   Zustand store с persist
  utils/
    color.ts                Конвертация HEX в RGBA
  App.tsx                   Корневой React-компонент
  CircleObject.ts           Тип физического объекта
  Engine.ts                 Главный цикл и интеграция PhysicsWorld + Renderer
  PhysicsWorld.ts           Физическая симуляция 
  Renderer.ts               Raw WebGL2 renderer
  Vector2D.ts               Векторная математика
  simulationConstants.ts    Размеры мира
  styles.css                Стили интерфейса
```

## Архитектура

### PhysicsWorld

`PhysicsWorld` хранит список кругов и обновляет физическое состояние:

- применяет скорость к позиции;
- обрабатывает столкновения с границами;
- проверяет все уникальные пары кругов;
- разрешает пересечения;
- пересчитывает скорости через импульсную модель упругого столкновения.

### Renderer

`Renderer` использует только WebGL2:

- один quad на каждый круг через `drawArraysInstanced`;
- instance buffer с позицией, радиусом и цветом;
- fragment shader рисует круг через signed distance function;
- сглаживание края выполняется через `fwidth` и `smoothstep`.

### Engine

`Engine` связывает физику и рендеринг:

- управляет `requestAnimationFrame`;
- считает `dt`;
- запускает, ставит на паузу и сбрасывает симуляцию;
- предоставляет React-safe singleton через `Engine.instance(...)`;
- корректно освобождает WebGL-ресурсы через `dispose()`.

### React UI

React-компоненты не хранят WebGL или физические объекты напрямую. UI работает с конфигурациями кругов в Zustand store, а `CanvasContainer` синхронизирует эти данные с `Engine`.

## Управление

- `Play` запускает симуляцию.
- `Pause` останавливает обновление физики.
- `Toggle` переключает состояние.
- `Reset` удаляет все круги.
- `Preset` загружает готовый набор объектов.
- `Add Circle` добавляет новый круг с параметрами из формы.

## Ограничения

- Столкновения между кругами проверяются полным перебором `O(n²)`.
- Для сотен объектов этого достаточно, но для тысяч кругов стоит добавить spatial hash или uniform grid.
- Симуляция использует дискретную интеграцию, поэтому при очень больших скоростях возможен tunneling.

## Проверка

Проект проверяется командой:

```bash
npm run build
```

Она запускает строгую TypeScript-проверку и production-сборку Vite.
