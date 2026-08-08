import { useState } from "react";
import { Text, TextInput, Button, View } from "react-native";
import { useSignIn } from "@clerk/expo";
import { Link } from "expo-router";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSignInPress = async () => {
    setError(null);
    const { error: passwordError } = await signIn.password({
      identifier: email,
      password,
    });
    if (passwordError) {
      setError(passwordError.message);
      return;
    }
    if (signIn.status === "complete") {
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) {
        setError(finalizeError.message);
      }
      return;
    }
    setError(
      `Additional verification required (status: ${signIn.status}) — not supported in this build yet.`,
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>Sign in</Text>
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
      {errors.fields.identifier ? (
        <Text style={{ color: "red" }}>{errors.fields.identifier.message}</Text>
      ) : null}
      {errors.fields.password ? (
        <Text style={{ color: "red" }}>{errors.fields.password.message}</Text>
      ) : null}
      <Button
        title={fetchStatus === "fetching" ? "Signing in..." : "Sign in"}
        onPress={onSignInPress}
        disabled={fetchStatus === "fetching"}
      />
      <Link href="/(auth)/sign-up">
        <Text>Don&apos;t have an account? Sign up</Text>
      </Link>
    </View>
  );
}
