import ArtilleryCalculator from './components/ArtilleryCalculator';

function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] py-8 relative">
      {/* Фоновая анимация */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img 
          src="/bulletfall.gif" 
          alt="" 
          className="w-full h-full object-cover opacity-70" // уменьшил прозрачность для темного фона
        />
      </div>
      
      {/* Основной контент */}
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <ArtilleryCalculator />
      </div>
    </div>
  );
}

export default App;