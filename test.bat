@echo off
chcp 65001
echo ==========================================
echo DevForge 测试脚本
echo ==========================================
echo.

:menu
echo 选择测试项目：
echo 1. 测试 KnowForge (知识管理)
echo 2. 测试 CodeForge (AI编程助手)
echo 3. 退出
echo.
set /p choice=请输入选项 (1-3): 

if "%choice%"=="1" goto test_knowforge
if "%choice%"=="2" goto test_codeforge
if "%choice%"=="3" goto end
goto menu

:test_knowforge
echo.
echo [测试 KnowForge]
echo 1. 启动服务器...
cd /d C:\WorkSpace\Projects\OpenclawAuto\projects\devforge\knowforge
start cmd /k "npm start"
echo.
echo 2. 等待服务器启动...
timeout /t 3 /nobreak >nul
echo.
echo 3. 打开浏览器...
start http://localhost:3000
echo.
echo 4. 测试检查清单：
echo    □ 创建笔记
echo    □ 编辑笔记
echo    □ 删除笔记
echo    □ 搜索功能
echo    □ 切换语言 (设置 → 语言)
echo    □ 切换主题 (设置 → 主题)
echo    □ 调整字体大小
echo    □ 导出数据
echo    □ 导入数据
echo.
pause
goto menu

:test_codeforge
echo.
echo [测试 CodeForge]
echo 1. 编译插件...
cd /d C:\WorkSpace\Projects\OpenclawAuto\projects\devforge\codeforge
call npx tsc
echo.
echo 2. 打开 VSCode...
echo    请按 F5 启动扩展开发窗口
echo.
echo 3. 配置 API Key:
echo    设置 → CodeForge → API Key
echo.
echo 4. 测试检查清单：
echo    □ 代码生成 (Ctrl+Shift+G)
echo    □ 代码解释 (Ctrl+Shift+E)
echo    □ 代码审查
echo    □ 代码重构
echo    □ 查看统计
echo    □ 检查中文/英文显示
echo.
pause
goto menu

:end
echo.
echo 测试完成！
pause