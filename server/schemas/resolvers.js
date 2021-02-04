const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        user: async (parent, { username }) => {
            return User.findOne({ username })
                .select('-__v -password')
                .populate('books')
        }
    },
    Mutation: {
        createUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user)
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if(!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);
            if(!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user)
            return { token, user };
        },
        addBook: async (parent, { bookId }, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { books: bookId } },
                    { new: true }
                ).populate('books')

                return updatedUser
            }

            throw new AuthenticationError('You need to be logged in!');
        },
        deleteBook: async (parent, { bookId }, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { books: bookId }},
                    { new: true }
                ).populate('books')

                return updatedUser
            }

            throw new AuthenticationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;