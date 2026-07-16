import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountsScreen } from '../screens/AccountsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';

export type AccountsStackParamList = {
  AccountsHome: undefined;
  Categories: undefined;
};

const Stack = createNativeStackNavigator<AccountsStackParamList>();

export function AccountsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountsHome" component={AccountsScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
    </Stack.Navigator>
  );
}
