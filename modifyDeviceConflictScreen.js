const fs = require('fs');

const run = () => {
  let content = fs.readFileSync('src/screens/DeviceConflictScreen.js', 'utf8');

  // Imports
  content = content.replace(
    'import { useNavigation } from "@react-navigation/native";',
    'import { useNavigation, useRoute } from "@react-navigation/native";\nimport { doc, updateDoc } from "firebase/firestore";\nimport { signOut } from "firebase/auth";\nimport { db, auth } from "../config/firebase";'
  );

  // Component start
  const compStartStr = `const DeviceConflictScreen = () => {
  const { deviceConflict, resolveDeviceConflict, cancelDeviceConflict } =
    useContext(AppContext);
  const navigation = useNavigation();
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const conflictDevice = deviceConflict?.devices?.[0];`;

  const compReplacement = `const DeviceConflictScreen = () => {
  const { login } = useContext(AppContext);
  const navigation = useNavigation();
  const route = useRoute();
  const { uid, newDeviceId, userData } = route.params || {};
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const conflictDevice = null;`;

  content = content.replace(compStartStr, compReplacement);

  // handleResolve
  const resolveStartStr = `  const handleResolve = async () => {
    setResolving(true);
    setError("");
    try {
      await resolveDeviceConflict();
    } catch (err) {
      setError(err.message || "Failed to sign out other device. Try again.");
      setResolving(false);
    }
  };`;

  const resolveReplacement = `  const handleResolve = async () => {
    setResolving(true);
    setError("");
    try {
      await updateDoc(doc(db, "users", uid), { currentDeviceId: newDeviceId });
      await login(userData);
    } catch (err) {
      setError(err.message || "Failed to sign out other device. Try again.");
      setResolving(false);
    }
  };`;

  content = content.replace(resolveStartStr, resolveReplacement);

  // handleCancel
  const cancelStartStr = `  const handleCancel = async () => {
    await cancelDeviceConflict();
    navigation.replace("Login");
  };`;

  const cancelReplacement = `  const handleCancel = async () => {
    try { await signOut(auth); } catch(e) {}
    navigation.replace("Login");
  };`;

  content = content.replace(cancelStartStr, cancelReplacement);

  fs.writeFileSync('src/screens/DeviceConflictScreen.js', content);
  console.log('Modified DeviceConflictScreen.js successfully');
};

run();