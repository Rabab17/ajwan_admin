import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import Swal from "sweetalert2";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginRes = await fetch("http://localhost:1337/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password: password }),
      });

      if (!loginRes.ok) {
        throw new Error("Login failed");
      }

      const loginData = await loginRes.json();
      const token = loginData.jwt;
      localStorage.setItem("token", token);

      const userRes = await fetch("http://localhost:1337/api/users/me?populate=role", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userRes.ok) {
        throw new Error("Fetching user failed");
      }

      const userData = await userRes.json();
      console.log("User data with role:", userData);

      if (userData.role && userData.role.id === 1) {
        Swal.fire({
          icon: "success",
          title: "تم تسجيل الدخول",
          text: "مرحبا بك في لوحة التحكم",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          onLogin(); // Call the onLogin prop to update the parent state
        });
      } else {
        localStorage.removeItem("token"); // Remove the token if the user doesn't have the correct role
        Swal.fire({
          icon: "error",
          title: "غير مسموح",
          text: "You do not have permission to access the dashboard.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "Invalid credentials or server error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 p-4 dark:from-gray-800 dark:to-gray-900">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ajwan Admin</h1>
          <p className="text-gray-600 dark:text-gray-400">{t("login")}</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-xl border-0 dark:bg-gray-700 dark:text-white">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">{t("login")}</CardTitle>
              <CardDescription className="text-center dark:text-gray-300">{t("welcome")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className="dark:text-gray-200">{t("username")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ajwan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="dark:text-gray-200">{t("password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-4">
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-base font-medium transition-all duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        t("login")
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>© 2024 Ajwan. {t("all_rights_reserved")}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;