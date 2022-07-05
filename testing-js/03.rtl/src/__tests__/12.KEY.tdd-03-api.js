import * as React from 'react'
import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {savePost as mockSavePost} from '../api'
import {Editor} from '../post-editor-03-api'

// problem: the form has a new feature where it uses the api to save the form data
// we want to mock the api call

// (1) mock the whole module with jest.mock()
jest.mock('../api')
// ensure all mocks from jest.mock api module have been cleared
afterEach(jest.clearAllMocks)

test('renders a form with title, content, tags, and a submit button', () => {
  // (2) use mockResolvedValueOnce to mock the function under test
  mockSavePost.mockResolvedValueOnce()
  // Arrange
  const fakeUser = {id: 'user-1'}
  render(<Editor user={fakeUser} />)

  // Act
  const fakePost = {
    title: 'Test title',
    content: 'Test content',
    tags: ['tag1', 'tag2'],
  }
  screen.getByLabelText(/title/i).value = fakePost.title
  screen.getByLabelText(/content/i).value = fakePost.content
  screen.getByLabelText(/tags/i).value = fakePost.tags.join(', ')
  const submitButton = screen.getByText(/submit/i)

  userEvent.click(submitButton)

  // Assert
  expect(submitButton).toBeDisabled()
  expect(mockSavePost).toHaveBeenCalledTimes(1)
  expect(mockSavePost).toHaveBeenCalledWith({
    ...fakePost,
    authorId: fakeUser.id,
  })
})
