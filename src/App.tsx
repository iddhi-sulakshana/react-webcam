import VerificationSteps from "./pages/VerificationSteps";

const App = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 px-4 sm:px-6">
            <div className="w-full max-w-sm flex-shrink-0 mt-4 sm:mt-8">
                <VerificationSteps />
            </div>
        </div>
    );
};

export default App;
