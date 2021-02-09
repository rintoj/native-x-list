# native-x-list

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

This component adds space between to other components

## Install

### Yarn

```sh
yarn add native-x-list
```

### NPM

```sh
npm install native-x-list
```

## Usage

```tsx
import { List } from 'native-x-list'

const users: User[] = [{ id: '1', name: 'John Doe', userId: 'johnd' }]

// with just render function
function UserList() {
  return <List items={users}>{user => <User user={user} />}</List>
}

// with additional elements
function UserList() {
  return (
    <List items={users}>
      <UserListHeader />
      {user => <User user={user} />}
      <UserListFooter />
    </List>
  )
}
```

You can integrate list with a search box as shown below:

```tsx
import { List } from 'native-x-list'
import { TextInput } from 'native-x-text-input'

function UserList() {
  const [searchText, setSearchText] = useState<string>()
  return (
    <List items={users} searchText={searchText}>
      <TextInput value={searchText} onChange={setSearchText} />
      {user => <User user={user} />}
    </List>
  )
}
```

## API

| Property                                                         | Default Value | Usage                                                                                                              |
| ---------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| children                                                         |               | Array of JSX elements and a render function                                                                        |
| columnWrapperStyle?: ViewStyle                                   |               | Additional styles for column wrapper                                                                               |
| disabled?: boolean                                               |               | Disables all interactions if set to true                                                                           |
| divider?: boolean                                                |               | Show a divider if set to true                                                                                      |
| emptyMessage?: { title: string, message: string}                 |               | Show "title" and a "message" if list is empty or use a render function                                             |
| error?: string                                                   |               | Error to show                                                                                                      |
| fill?: boolean                                                   |               | Fill the container                                                                                                 |
| groupBy?: Function                                               |               | A function to return a value or name of the property as "string" to group by which will be used as section headers |
| horizontal?: boolean                                             |               | Render list horizontally                                                                                           |
| isRefreshing?: boolean                                           |               | Shows a "pull-to-refresh" animation when true                                                                      |
| items: S[]                                                       |               | (mandatory) Array of items                                                                                         |
| keyExtractor?: Function                                          |               | A function to return a value or name of the property as "string" to use as key                                     |
| loading?: boolean                                                |               | Shows spinner if set to true                                                                                       |
| maintainVisibleContent?: boolean                                 |               | Maintain visible content if set to true                                                                            |
| numColumn?: number                                               |               | Number of columns for the list                                                                                     |
| onFetchNext?: () => void                                         |               | A function to fetch next page when reaching end of the list (useful for paginated list)                            |
| onRefresh?: () => void                                           |               | Event handler when user "pull-to-refresh"                                                                          |
| onScroll?: (e?: NativeSyntheticEvent<NativeScrollEvent>) => void |               | Event handler for scroll                                                                                           |
| onScrollToTopChange?: () => void                                 |               | Event handler when the list is scrolled to the top of the list                                                     |
| onSelectItem?: (props: { item: S, index?: number}) => void       |               | Event handler when an item is pressed                                                                              |
| renderSectionHeader?: (title: string) => ReactNode               |               | A function to render section header                                                                                |
| searchBy?: Function                                              |               | A function to return a value or name of the property as "string" to search by                                      |
| searchText?: string                                              |               | A string to use as search pattern                                                                                  |
| separator?: ReactNode                                            |               | JSX element to render as separator between elements                                                                |
| showScrollIndicator?: boolean                                    |               | Show scroll indicator if set to true                                                                               |
| stickySectionHeadersEnabled?: boolean                            |               | Use sticky section headers                                                                                         |
| style?: ViewStyle                                                |               | Additional styles for the list                                                                                     |

## Automatic Release

Here is an example of the release type that will be done based on a commit messages:

| Commit message      | Release type          |
| ------------------- | --------------------- |
| fix: [comment]      | Patch Release         |
| feat: [comment]     | Minor Feature Release |
| perf: [comment]     | Major Feature Release |
| doc: [comment]      | No Release            |
| refactor: [comment] | No Release            |
| chore: [comment]    | No Release            |
