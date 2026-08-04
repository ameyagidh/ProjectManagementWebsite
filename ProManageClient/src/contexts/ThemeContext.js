import { createContext, Component} from 'react';

export const ThemeContext = createContext();

// Design tokens for the ProManage premium theme. Two palettes (light/dark)
// consumed via ThemeContext by every screen - see Login.js, Home.js,
// NavBar.js, Main.js, AddRoom.js, Logs.js.
class ThemeContextProvider extends Component {
    state = {
        isLightTheme: false,
        light: {
            text: '#151922',
            ui: '#F4F5F7',
            box: '#FFFFFF',
            innerBox: '#ECEEF3',
            button: '#6366F1',
            input: '#FFFFFF',
            placeholder: '#6B7280',
            navbar: '#FFFFFF',
            modalColor: '#FFFFFF',
            modalBackground: '#E5E7EB',
            textNotImp: '#6B7280',
            accent: '#8B5CF6',
            border: '#E2E4EA',
            success: '#10B981',
            warn: '#F59E0B',
            danger: '#EF4444'
        },
        dark: {
            text: '#F3F4F6',
            ui: '#0B0D12',
            box: '#151922',
            innerBox: '#1B2130',
            button: '#6366F1',
            input: '#1B2130',
            placeholder: '#9CA3AF',
            navbar: '#0F1219',
            modalColor: '#151922',
            modalBackground: '#1B2130',
            textNotImp: '#9CA3AF',
            accent: '#8B5CF6',
            border: '#232936',
            success: '#10B981',
            warn: '#F59E0B',
            danger: '#EF4444'
        }
     }
     toggleTheme = () => { 
         this.setState({ isLightTheme: !this.state.isLightTheme })
     }
    render() { 
        return (
            <ThemeContext.Provider value={{...this.state, toggleTheme: this.toggleTheme }}>
                {this.props.children}
            </ThemeContext.Provider>
        );
    }
}
 
export default ThemeContextProvider;