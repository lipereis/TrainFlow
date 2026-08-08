import { useState } from "react";
import { Text, TextInput, Button, View } from "react-native";
import { useSignUp } from "@clerk/expo";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSignUpPress = async () => {
    setError(null);
    const { error: passwordError } = await signUp.password({
      emailAddress: email,
      password,
    });
    if (passwordError) {
      setError(passwordError.message);
      return;
    }
    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        setError(finalizeError.message);
      }
      return;
    }
    setError(
      `Email verification required (status: ${signUp.status}) — not supported in this build yet.`,
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Sign up</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 }}
      />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      {errors.fields.emailAddress ? (
        <Text style={{ color: "red" }}>{errors.fields.emailAddress.message}</Text>
      ) : null}
      {errors.fields.password ? (
        <Text style={{ color: "red" }}>{errors.fields.password.message}</Text>
      ) : null}
      <Button
        title={fetchStatus === "fetching" ? "Signing up..." : "Sign up"}
        onPress={onSignUpPress}
        disabled={fetchStatus === "fetching"}
      />
    </View>
  );
}
