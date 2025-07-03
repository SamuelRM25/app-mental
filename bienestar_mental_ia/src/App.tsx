import React, { useState, useEffect } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  signInAnonymously,
  Auth,
  User,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'; // Importar Firestore type

// Declarar las variables globales para TypeScript
// Estas variables son proporcionadas por el entorno de Canvas.
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | null | undefined;

// Asegúrate de que estas variables globales estén disponibles en el entorno de Canvas.
// Si no están definidas, se usarán valores predeterminados para evitar errores.
const appId: string = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig: object = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken: string | null = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Componente principal de la aplicación
function App() {
  // Estados para la autenticación y los datos de Firebase
  const [user, setUser] = useState<User | null>(null); // Almacena el objeto de usuario autenticado
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true); // Indica si la autenticación inicial está cargando
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false); // Indica si el estado de autenticación ha sido verificado
  const [email, setEmail] = useState<string>(''); // Estado para el campo de email
  const [password, setPassword] = useState<string>(''); // Estado para el campo de contraseña
  const [message, setMessage] = useState<string>(''); // Estado para mostrar mensajes al usuario (éxito/error)
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>(''); // Tipo de mensaje: 'success' o 'error'

  // Instancias de Firebase
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);

  // useEffect para inicializar Firebase y configurar el listener de autenticación
  useEffect(() => {
    try {
      // Inicializar la aplicación Firebase
      const app: FirebaseApp = initializeApp(firebaseConfig);
      const authInstance: Auth = getAuth(app);
      const dbInstance: Firestore = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      // Configurar el listener de cambios en el estado de autenticación
      const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
        if (!initialAuthToken && !currentUser) {
          // Si no hay token inicial y no hay usuario, intentar iniciar sesión anónimamente
          try {
            await signInAnonymously(authInstance);
            console.log("Signed in anonymously.");
          } catch (anonError: any) { // Cast a 'any' para acceder a .message
            console.error("Error signing in anonymously:", anonError);
            showMessage(`Error al iniciar sesión anónimamente: ${anonError.message}`, 'error');
          }
        }
        setUser(currentUser);
        setLoadingAuth(false);
        setIsAuthReady(true); // La autenticación inicial ha terminado
        console.log("Auth state changed. Current user:", currentUser?.uid);
      });

      // Si hay un token de autenticación inicial, intentar iniciar sesión con él
      if (initialAuthToken) {
        signInWithCustomToken(authInstance, initialAuthToken)
          .then((userCredential) => {
            console.log("Signed in with custom token:", userCredential.user.uid);
          })
          .catch((error: any) => { // Cast a 'any' para acceder a .message
            console.error("Error signing in with custom token:", error);
            showMessage(`Error al iniciar sesión con token: ${error.message}`, 'error');
            // Si falla el token, intentar anónimamente como fallback
            signInAnonymously(authInstance)
              .then(() => console.log("Signed in anonymously after custom token failure."))
              .catch((anonErr: any) => console.error("Error signing in anonymously fallback:", anonErr));
          });
      }

      // Limpiar el listener al desmontar el componente
      return () => unsubscribe();
    } catch (error: any) { // Cast a 'any' para acceder a .message
      console.error("Error initializing Firebase:", error);
      showMessage(`Error al inicializar Firebase: ${error.message}`, 'error');
      setLoadingAuth(false);
      setIsAuthReady(true);
    }
  }, [initialAuthToken, firebaseConfig]); // Dependencias para que se ejecute una vez

  // Función para mostrar mensajes al usuario
  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000); // El mensaje desaparece después de 5 segundos
  };

  // Manejador para el registro de usuario
  const handleSignUp = async () => {
    if (!auth) {
      showMessage('Firebase Auth no está inicializado.', 'error');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showMessage('¡Registro exitoso! Has iniciado sesión.', 'success');
      setEmail('');
      setPassword('');
    } catch (error: any) { // Cast a 'any' para acceder a .message
      console.error("Error al registrar:", error);
      showMessage(`Error al registrar: ${error.message}`, 'error');
    }
  };

  // Manejador para el inicio de sesión
  const handleSignIn = async () => {
    if (!auth) {
      showMessage('Firebase Auth no está inicializado.', 'error');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage('¡Inicio de sesión exitoso!', 'success');
      setEmail('');
      setPassword('');
    } catch (error: any) { // Cast a 'any' para acceder a .message
      console.error("Error al iniciar sesión:", error);
      showMessage(`Error al iniciar sesión: ${error.message}`, 'error');
    }
  };

  // Manejador para cerrar sesión
  const handleSignOut = async () => {
    if (!auth) {
      showMessage('Firebase Auth no está inicializado.', 'error');
      return;
    }
    try {
      await signOut(auth);
      showMessage('Has cerrado sesión.', 'success');
    } catch (error: any) { // Cast a 'any' para acceder a .message
      console.error("Error al cerrar sesión:", error);
      showMessage(`Error al cerrar sesión: ${error.message}`, 'error');
    }
  };

  // Si la autenticación inicial está cargando, mostrar un spinner o mensaje
  if (loadingAuth || !isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 font-inter">
        <div className="flex flex-col items-center">
          {/* Spinner simple de carga */}
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16 mb-4 animate-spin"></div>
          <p className="text-lg text-gray-700">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center font-inter p-4">
      {/* Contenedor principal de la aplicación */}
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-indigo-800 mb-6">Bienestar Mental con IA</h1>

        {/* Área de mensajes */}
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Renderizado condicional basado en si el usuario está autenticado */}
        {user ? (
          /* Vista del Dashboard si el usuario está autenticado */
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">¡Bienvenido!</h2>
            <p className="text-gray-600 mb-2">Has iniciado sesión como:</p>
            <p className="font-medium text-indigo-700 break-words mb-6">{user.email || `Usuario ID: ${user.uid}`}</p>
            <p className="text-sm text-gray-500 mb-6">
              ID de usuario (para referencia en entornos multiusuario): <span className="font-mono bg-gray-100 rounded px-2 py-1 text-gray-700 text-xs select-all">{user.uid}</span>
            </p>
            <button
              onClick={handleSignOut}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl transition duration-300 transform hover:scale-105 shadow-md"
            >
              Cerrar Sesión
            </button>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Tu Espacio de Bienestar</h3>
              <p className="text-gray-600">Aquí podrás acceder a tus sesiones de meditación, diario y más.</p>
              <p className="text-sm text-gray-500 mt-2">
                (Funcionalidades futuras: Registro de estado de ánimo, Diario, Meditaciones IA, Chatbot)
              </p>
            </div>
          </div>
        ) : (
          /* Vista de Login/Registro si el usuario no está autenticado */
          <div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleSignIn}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition duration-300 transform hover:scale-105 shadow-md"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={handleSignUp}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-xl transition duration-300 transform hover:scale-105 shadow-md"
              >
                Registrarse
              </button>
            </div>
            <p className="text-center text-gray-500 text-xs mt-6">
              Al registrarte o iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

