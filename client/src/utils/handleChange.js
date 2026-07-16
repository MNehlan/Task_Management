export function handleChange(e, setter) {
  setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
}
