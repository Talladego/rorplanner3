# RorPlanner

A modern React application for planning character equipment loadouts in Warhammer Online: Return of Reckoning, built with Vite, TypeScript, and Tailwind CSS.

## Features

- ⚔️ Equipment planning for all character classes
- 🎨 Dark/Light theme support
- 🔍 Interactive equipment selection
- 📊 Real-time stat calculations
- 🎯 Responsive design
- 🚀 Fast development with Vite

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **GraphQL**: Apollo Client
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rorplanner3
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── DualToolbar.tsx     # Per-side selection and controls (A/B)
│   ├── DualEquipmentLayout.tsx # Dual compare layout (A | Stats | B)
│   ├── EquipmentPanel.tsx # Equipment slots display per side
│   └── EquipmentSelector.tsx # Item selection modal
├── store/              # Zustand state management
├── lib/                # Apollo Client configuration
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
